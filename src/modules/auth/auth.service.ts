import { CreateUserDto } from '@modules/users/dto/create-user.dto';
import { UsersService } from '@modules/users/users.service';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthJwtPayload } from './types/auth-jwt.payload';
import { JwtService } from '@nestjs/jwt';
import refreshJwtConfig from './configs/refresh-jwt.config';
import { ConfigType } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { compareString, hashString } from '@utils/auth';
import { MaillerService } from '@modules/mail/mail.service';
import { ValidationException } from '@exceptions/validation.exception';
import { ErrorCode } from '@constants/error-code.constant';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { RoleEnum } from 'src/enums/role.enum';
import { CreateOtpDto } from './dto/create-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private readonly refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
    private readonly maillerService: MaillerService,
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  async validateGoogleUser(googleUser: CreateUserDto) {
    try {
      const user = await this.userService.findByEmail(googleUser.email);
      if (user) return user;
      const newUser = await this.userService.create(googleUser);
      this.maillerService.sendMailWelcome({
        email: googleUser.email,
        username: googleUser.lastName || '',
      });
      return newUser;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async validateUser(email: string, password: string) {
    try {
      const user = await this.userService.findByEmailIncludePassword(email);
      if (!user) throw new ValidationException(ErrorCode.U003);
      const isPasswordValid = await compareString(password, user.password);
      if (!isPasswordValid) throw new ValidationException(ErrorCode.U002);
      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async register(payload: RegisterDto) {
    try {
      const checkExist = await this.userService.findByEmail(payload.email);
      if (checkExist) throw new ValidationException(ErrorCode.U005);

      const hashPassword = await hashString(payload.password);
      payload.password = hashPassword;
      await this.userService.create(payload);
      this.maillerService.sendMailWelcome({
        email: payload.email,
        username: payload.lastName,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async login(userId: string, role: RoleEnum) {
    const { accessToken, refreshToken } = await this.generateTokens(
      userId,
      role,
    );
    await this.userService.updateRefreshToken(userId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async generateTokens(userId: string, role: RoleEnum) {
    try {
      const payload: AuthJwtPayload = { sub: userId, role: role };

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload),
        this.jwtService.signAsync(payload, this.refreshTokenConfig),
      ]);

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Error generating tokens:', error);
      throw error;
    }
  }

  async refreshToken(userId: string, refresh_token: string) {
    try {
      const user = await this.userService.findById(userId);

      if (!user) throw new ForbiddenException('Access Denied');

      const refreshTokenRedis = (await this.redis.get(
        `RT_${userId}`,
      )) as string;
      if (!refreshTokenRedis) {
        throw new ForbiddenException('Access Denied');
      }

      const refreshTokenMatches = await compareString(
        refresh_token,
        refreshTokenRedis,
      );
      if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');

      // tao moi  at va rt, luu rt vao db
      const tokens = await this.generateTokens(
        user.id,
        user.role.name as RoleEnum,
      );
      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new ForbiddenException('Access Denied');
      }

      await this.userService.updateRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  async createOtp(createOtpDto: CreateOtpDto): Promise<{ message: string }> {
    try {
      const { email } = createOtpDto;

      const user = await this.userService.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const otpKey = `OTP_${email}`;
      await this.redis.setex(otpKey, 600, otp);

      try {
        this.maillerService.sendOtpEmail({
          email,
          otp,
          username: user.firstName || user.email,
          expiryTime: '10',
        });
      } catch (emailError) {
        await this.redis.del(otpKey);
        console.error('Email sending failed:', emailError);
        throw new BadRequestException(
          'Failed to send OTP email. Please check your email configuration.',
        );
      }

      return { message: 'OTP sent successfully to your email' };
    } catch (error) {
      console.error('Error creating OTP:', error);
      throw error;
    }
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
    try {
      const { email, otp } = verifyOtpDto;

      const otpKey = `OTP_${email}`;
      const storedOtp = await this.redis.get(otpKey);

      if (!storedOtp) {
        throw new BadRequestException('OTP has expired or does not exist');
      }

      if (storedOtp !== otp) {
        throw new BadRequestException('Invalid OTP');
      }

      const verifiedKey = `OTP_VERIFIED_${email}`;
      await this.redis.setex(verifiedKey, 300, 'true');

      await this.redis.del(otpKey);

      return { message: 'OTP verified successfully' };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    try {
      const { oldPassword, newPassword, confirmPassword } = changePasswordDto;

      if (newPassword !== confirmPassword) {
        throw new BadRequestException(
          'New password and confirm password do not match',
        );
      }

      const user = await this.userService.findByIdWithPassword(userId);
      if (!user || !user.password) {
        throw new NotFoundException('User not found or password not set');
      }

      const isOldPasswordValid = await compareString(
        oldPassword,
        user.password,
      );
      if (!isOldPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      const hashedNewPassword = await hashString(newPassword);

      await this.userService.updatePassword(userId, hashedNewPassword);

      return { message: 'Password changed successfully' };
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    try {
      const { email, password, confirmPassword } = forgotPasswordDto;

      if (password !== confirmPassword) {
        throw new BadRequestException(
          'Password and confirm password do not match',
        );
      }

      const verifiedKey = `OTP_VERIFIED_${email}`;
      const isVerified = await this.redis.get(verifiedKey);

      if (!isVerified) {
        throw new BadRequestException(
          'OTP not verified or has expired. Please verify OTP first',
        );
      }

      const user = await this.userService.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const hashedPassword = await hashString(password);

      await this.userService.updatePassword(user.id, hashedPassword);

      await this.redis.del(verifiedKey);
      await this.redis.del(`OTP_${email}`);

      return { message: 'Password reset successfully' };
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }
}
