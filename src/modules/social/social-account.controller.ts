import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  Get,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SocialAccountService } from './social-account.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { SocialAccount } from './entities/social-account.entity';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { GetUser } from '@decorators/auth/get-user.decorator';
import { ResponseSocialDto } from './dto/response-social.dto';

@ApiTags('Social Accounts')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'social-accounts', version: '1' })
export class SocialAccountController {
  constructor(private readonly socialAccountService: SocialAccountService) {}

  @Post()
  @ApiOperation({ summary: 'Create new social media account' })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
    type: SocialAccount,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async create(
    @Body() createSocialAccountDto: CreateSocialAccountDto,
    @GetUser('sub') user_id: string,
  ): Promise<ApiResponseDto<void>> {
    await this.socialAccountService.create(createSocialAccountDto, user_id);
    return new ApiResponseDto(201, 'Account created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all social media accounts (Admin Only)' })
  @ApiResponse({
    status: 200,
    description: 'Accounts found successfully',
    type: SocialAccount,
  })
  async findAll(
    @GetUser('sub') user_id: string,
  ): Promise<ApiResponseDto<ResponseSocialDto[]>> {
    const response = await this.socialAccountService.findMyPageInfo(user_id);
    return new ApiResponseDto(200, 'Accounts found successfully', response);
  }

  @Get('my-social-accounts')
  @ApiOperation({ summary: 'Get my social media accounts' })
  @ApiResponse({
    status: 200,
    description: 'Accounts found successfully',
    type: SocialAccount,
  })
  async findMySocialAccounts(
    @GetUser('sub') user_id: string,
  ): Promise<ApiResponseDto<ResponseSocialDto[]>> {
    const response =
      await this.socialAccountService.findMySocialAccounts(user_id);
    return new ApiResponseDto(200, 'Accounts found successfully', response);
  }

  @Get(':social_account_id')
  @ApiOperation({ summary: 'Get social media account by page id' })
  @ApiResponse({
    status: 200,
    description: 'Account found successfully',
    type: SocialAccount,
  })
  async findPageInfo(
    @Param('social_account_id') social_account_id: string,
    @GetUser('sub') user_id: string,
  ): Promise<ApiResponseDto<ResponseSocialDto>> {
    const response = await this.socialAccountService.findPageInfo(
      social_account_id,
      user_id,
    );
    return new ApiResponseDto(200, 'Account found successfully', response);
  }

  @Delete(':social_account_id')
  @ApiOperation({ summary: 'Delete social media account' })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
    type: SocialAccount,
  })
  async delete(
    @Param('social_account_id') social_account_id: string,
    @GetUser('sub') user_id: string,
  ): Promise<ApiResponseDto<void>> {
    await this.socialAccountService.delete(social_account_id, user_id);
    return new ApiResponseDto(200, 'Account deleted successfully');
  }
}
