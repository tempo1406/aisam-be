import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseRoleDto } from './dto/response-role.dto';
import { plainToInstance } from 'class-transformer';
import { ValidationException } from '@exceptions/validation.exception';
import { ErrorCode } from '@constants/error-code.constant';
import { RoleEnum } from 'src/enums/role.enum';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<ResponseRoleDto> {
    try {
      const existingRole = await this.roleRepository.findOne({
        where: { name: createRoleDto.name },
      });
      if (existingRole) {
        throw new ValidationException(ErrorCode.R002);
      }
      const role = this.roleRepository.create(createRoleDto);
      await this.roleRepository.save(role);
      return plainToInstance(ResponseRoleDto, role);
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  async findAll(): Promise<ResponseRoleDto[]> {
    try {
      const roles = await this.roleRepository.find();
      return plainToInstance(ResponseRoleDto, roles);
    } catch (error) {
      console.error('Error finding all roles:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<ResponseRoleDto> {
    try {
      const role = await this.roleRepository.findOne({ where: { id } });
      return plainToInstance(ResponseRoleDto, role);
    } catch (error) {
      console.error('Error finding role:', error);
      throw error;
    }
  }

  async update(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<ResponseRoleDto> {
    try {
      const role = await this.roleRepository.findOne({ where: { id } });
      if (!role) {
        throw new ValidationException(ErrorCode.R002);
      }
      await this.roleRepository.update(id, updateRoleDto);
      return plainToInstance(ResponseRoleDto, role);
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  async remove(id: string): Promise<ResponseRoleDto> {
    try {
      const role = await this.roleRepository.findOne({ where: { id } });
      if (!role) {
        throw new ValidationException(ErrorCode.R002);
      }
      await this.roleRepository.delete(id);
      return plainToInstance(ResponseRoleDto, role);
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  }

  async findByName(name: RoleEnum): Promise<ResponseRoleDto> {
    try {
      const role = await this.roleRepository.findOne({ where: { name } });
      if (!role) {
        throw new ValidationException(ErrorCode.R002);
      }
      return plainToInstance(ResponseRoleDto, role);
    } catch (error) {
      console.error('Error finding role by name:', error);
      throw error;
    }
  }
}
