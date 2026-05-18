import { Injectable, NotFoundException } from '@nestjs/common';
import { forwardRef, Inject } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { convertToSeconds, hashString } from '@utils/auth';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { ResponseUserDto } from './dto/response-user.dto';
import { plainToInstance } from 'class-transformer';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { getDefaultAvatarUrl } from '@utils/default-avatar';
import { ValidationException } from '@exceptions/validation.exception';
import { ErrorCode } from '@constants/error-code.constant';
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';
import { RolesService } from '@modules/roles/roles.service';
import { RoleEnum } from 'src/enums/role.enum';
import { USER_CACHE } from '@modules/cache/constants/user-cache.constant';
import { CacheService } from '@modules/cache/cache.service';
import { TTL_CACHE } from '@modules/cache/constants/ttl-cache.constant';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { USER_EVENTS } from '@modules/events/constants/user-events.constant';
import { AdminUserDto, UserManagementFilterDto } from './dto/admin-user.dto';
import { SocialAccount } from '@modules/social/entities/social-account.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SocialAccount)
    private socialAccountRepository: Repository<SocialAccount>,
    @InjectRedis()
    private redis: Redis,
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
    @Inject(forwardRef(() => RolesService))
    private rolesService: RolesService,
    private cacheService: CacheService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const role = await this.rolesService.findByName(RoleEnum.USER);
      const user = this.userRepository.create({
        ...createUserDto,
        roleId: role.id,
      });
      const savedUser = await this.userRepository.save(user);

      // Emit welcome notification event
      this.eventEmitter.emit(USER_EVENTS.CREATED, {
        userId: savedUser.id,
        firstName: savedUser.firstName,
        email: savedUser.email,
      });

      return savedUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async findAll() {
    const cachedUsers = await this.cacheService.get<ResponseUserDto[]>(
      USER_CACHE.ALL,
    );
    if (cachedUsers) {
      return cachedUsers;
    }
    const users = await this.findAllWithDefaultAvatar();
    await this.cacheService.set<ResponseUserDto[]>(
      USER_CACHE.ALL,
      users,
      TTL_CACHE.USER,
    );
    return users;
  }

  async findByEmail(email: string): Promise<ResponseUserDto> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && !user.avatar) {
      user.avatar = getDefaultAvatarUrl();
    }
    return plainToInstance(ResponseUserDto, user);
  }

  async findByEmailIncludePassword(email: string): Promise<ResponseUserDto> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'firstName',
        'lastName',
        'avatar',
        'bio',
        'phone',
        'dateOfBirth',
        'address',
        'provider',
        'role',
        'createdAt',
        'updatedAt',
      ],
      relations: ['role'],
    });
    if (user && !user.avatar) {
      user.avatar = getDefaultAvatarUrl();
    }
    return plainToInstance(ResponseUserDto, user);
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    try {
      const refreshTokenTtl = this.configService.get(
        'refresh-jwt.expiresIn',
      ) as string;

      const hashedRefreshToken = await hashString(refreshToken);
      const refreshTokenTtlInSeconds = convertToSeconds(refreshTokenTtl);
      await this.redis.set(
        `RT_${userId}`,
        hashedRefreshToken,
        'EX',
        refreshTokenTtlInSeconds,
      );
    } catch (error) {
      console.error('Error updating refresh token:', error);
      throw error;
    }
  }

  async getRefreshToken(userId: string) {
    const refreshToken = await this.redis.get(`RT_${userId}`);
    return refreshToken;
  }

  async deleteRefreshToken(userId: string) {
    await this.redis.del(`RT_${userId}`);
  }

  async findById(userId: string): Promise<ResponseUserDto> {
    try {
      const cachedUser = await this.cacheService.get<ResponseUserDto>(
        USER_CACHE.ONE(userId),
      );
      if (cachedUser) {
        return cachedUser;
      }
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['role'],
      });
      if (!user) {
        throw new ValidationException(ErrorCode.U003);
      }

      // Set default avatar if not exists
      if (!user.avatar) {
        user.avatar = getDefaultAvatarUrl();
      }

      const result = plainToInstance(ResponseUserDto, user);
      await this.cacheService.set<ResponseUserDto>(
        USER_CACHE.ONE(userId),
        result,
        TTL_CACHE.USER,
      );
      return result;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ResponseUserDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ValidationException(ErrorCode.U003);
    }

    // Convert dateOfBirth string to Date if provided
    if (updateProfileDto.dateOfBirth) {
      user.dateOfBirth = new Date(updateProfileDto.dateOfBirth);
    }

    // Update user properties
    const allowedFields = ['firstName', 'lastName', 'bio', 'phone', 'address'];
    const updates = Object.fromEntries(
      Object.entries(updateProfileDto).filter(
        ([key, value]) => value !== undefined && allowedFields.includes(key),
      ),
    );
    Object.assign(user, updates);

    const savedUser = await this.userRepository.save(user);

    // Set default avatar if not exists
    if (!savedUser.avatar) {
      savedUser.avatar = getDefaultAvatarUrl();
    }

    this.eventEmitter.emit(USER_EVENTS.UPDATED, { id: userId });

    return plainToInstance(ResponseUserDto, savedUser);
  }

  async updateAvatar(
    userId: string,
    avatarUrl: string,
  ): Promise<ResponseUserDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ValidationException(ErrorCode.U003);
    }

    // Update avatar
    user.avatar = avatarUrl;
    const savedUser = await this.userRepository.save(user);
    this.eventEmitter.emit(USER_EVENTS.UPDATED, { id: userId });

    return plainToInstance(ResponseUserDto, savedUser);
  }

  async findAllWithDefaultAvatar(): Promise<ResponseUserDto[]> {
    try {
      // Check if users are cached
      const cachedUsers = await this.cacheService.get<ResponseUserDto[]>(
        USER_CACHE.ALL,
      );
      if (cachedUsers) {
        return cachedUsers;
      }

      const users = await this.userRepository.find();

      // Set default avatar for users without avatar
      const usersWithAvatar = users.map((user) => {
        if (!user.avatar) {
          user.avatar = getDefaultAvatarUrl();
        }
        return user;
      });

      const result = plainToInstance(ResponseUserDto, usersWithAvatar);
      // Cache users
      await this.cacheService.set<ResponseUserDto[]>(
        USER_CACHE.ALL,
        result,
        TTL_CACHE.USER,
      );
      return result;
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }

  async deleteAvatar(userId: string): Promise<void> {
    try {
      // Get current user to check if they have an avatar
      const currentUser = await this.findById(userId);
      const avatar = currentUser.avatar;

      if (!avatar.includes('ik.imagekit.io')) {
        await this.cloudinaryService.deleteFileByUrl(avatar);
        // get default avatar url
        const defaultAvatarUrl = getDefaultAvatarUrl();
        await this.userRepository.update(userId, { avatar: defaultAvatarUrl });
      }

      this.eventEmitter.emit(USER_EVENTS.UPDATED, { id: userId });
    } catch (error) {
      console.error('Error deleting avatar:', error);
      throw error;
    }
  }

  async findByIdWithPassword(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'password', 'firstName', 'lastName'],
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    try {
      const result = await this.userRepository.update(userId, {
        password: hashedPassword,
      });

      if (result.affected === 0) {
        throw new NotFoundException('User not found');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  // ==================== ADMIN METHODS ====================
  async getAdminUsers(filters: UserManagementFilterDto): Promise<{
    users: AdminUserDto[];
    total: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, search, role, provider } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoin('Post', 'post', 'post.user_id = user.id')
      .leftJoin('social_accounts', 'sa', 'sa.user_id = user.id')
      .addSelect('COUNT(post.id)', 'totalPosts')
      .addSelect('COUNT(sa.id)', 'social_count')
      .groupBy('user.id')
      .addGroupBy('role.id');

    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (role) {
      queryBuilder.andWhere('role.name = :role', { role });
    }

    if (provider) {
      queryBuilder.andWhere('user.provider = :provider', { provider });
    }

    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / limit);

    const rawUsers = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const users = rawUsers.map((raw) => ({
      id: raw.user_id,
      email: raw.user_email,
      firstName: raw.user_firstName,
      lastName: raw.user_lastName,
      avatar: raw.user_avatar,
      bio: raw.user_bio,
      phone: raw.user_phone,
      dateOfBirth: raw.user_dateOfBirth,
      address: raw.user_address,
      provider: raw.user_provider,
      role: {
        id: raw.role_id,
        name: raw.role_name,
        description: raw.role_description,
      },
      createdAt: raw.user_createdAt,
      updatedAt: raw.user_updatedAt,
      totalPosts: parseInt(raw.totalPosts) || 0,
      hasSocialAccount: !!raw.social_count && parseInt(raw.social_count) > 0,
      socialAccounts: [],
    }));

    return { users, total, totalPages };
  }

  async getAdminUserById(id: string): Promise<AdminUserDto> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoin('Post', 'post', 'post.user_id = user.id')
      .addSelect('COUNT(post.id)', 'totalPosts')
      .where('user.id = :id', { id })
      .groupBy('user.id')
      .addGroupBy('role.id')
      .getRawOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const socialAccounts = await this.socialAccountRepository.find({
      where: {
        user_id: id,
        deleted_at: IsNull(),
      },
      select: [
        'id',
        'platform',
        'page_id',
        'page_name',
        'status',
        'created_at',
      ],
    });

    const socialAccountsFormatted = socialAccounts.map((social) => ({
      id: social.id,
      platform: social.platform,
      page_id: social.page_id,
      page_name: social.page_name,
    }));

    return {
      id: user.user_id,
      email: user.user_email,
      firstName: user.user_firstName,
      lastName: user.user_lastName,
      avatar: user.user_avatar,
      bio: user.user_bio,
      phone: user.user_phone,
      dateOfBirth: user.user_dateOfBirth,
      address: user.user_address,
      provider: user.user_provider,
      role: {
        id: user.role_id,
        name: user.role_name,
        description: user.role_description,
      },
      createdAt: user.user_createdAt,
      updatedAt: user.user_updatedAt,
      totalPosts: parseInt(user.totalPosts) || 0,
      socialAccounts: socialAccountsFormatted,
      hasSocialAccount: socialAccountsFormatted.length > 0,
    };
  }

  async deleteAdminUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.delete(userId);
  }

  async banUser(userId: string, reason?: string): Promise<ResponseUserDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new ValidationException(ErrorCode.U003);
      }

      if (user.banned) {
        throw new ValidationException(ErrorCode.U006);
      }

      user.banned = true;
      user.banReason = reason || 'No reason provided';
      user.bannedAt = new Date();

      await this.userRepository.save(user);

      await this.cacheService.del(USER_CACHE.BY_ID(userId));
      await this.cacheService.del(USER_CACHE.BY_EMAIL(user.email));

      this.eventEmitter.emit(USER_EVENTS.BANNED, {
        userId: user.id,
        reason: user.banReason,
      });

      return plainToInstance(ResponseUserDto, user);
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  }

  async unbanUser(userId: string): Promise<ResponseUserDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new ValidationException(ErrorCode.U003);
      }

      if (!user.banned) {
        throw new ValidationException(ErrorCode.U007);
      }

      user.banned = false;
      user.banReason = undefined;
      user.bannedAt = undefined;

      await this.userRepository.save(user);

      await this.cacheService.del(USER_CACHE.BY_ID(userId));
      await this.cacheService.del(USER_CACHE.BY_EMAIL(user.email));

      this.eventEmitter.emit(USER_EVENTS.UNBANNED, {
        userId: user.id,
      });

      return plainToInstance(ResponseUserDto, user);
    } catch (error) {
      console.error('Error unbanning user:', error);
      throw error;
    }
  }

  async getBannedUsers(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await this.userRepository.findAndCount({
        where: { banned: true },
        relations: ['role'],
        order: { bannedAt: 'DESC' },
        skip,
        take: limit,
      });

      return {
        data: plainToInstance(ResponseUserDto, users),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error getting banned users:', error);
      throw error;
    }
  }
}
