import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { InstagramService } from './instagram.service';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import {
  PublishInstagramPostDto,
  PublishInstagramReelDto,
  InstagramMediaResponseDto,
  InstagramInsightsDto,
} from './dtos/publish-instagram.dto';
import { SocialAccountService } from '@modules/social/social-account.service';

@ApiTags('Instagram')
@ApiBearerAuth('Authorization')
@Controller({ path: 'instagram', version: '1' })
export class InstagramController {
  constructor(
    private readonly instagramService: InstagramService,
    private readonly socialAccountService: SocialAccountService,
  ) {}

  @Post('publish')
  @ApiOperation({
    summary: 'Publish image post to Instagram',
    description:
      'Publish a single image post to Instagram Business Account. Requires image URL and caption.',
  })
  @ApiResponse({
    status: 200,
    description: 'Post published successfully',
    type: InstagramMediaResponseDto,
  })
  @ApiBody({ type: PublishInstagramPostDto })
  async publishPost(
    @Body() dto: PublishInstagramPostDto,
  ): Promise<ApiResponseDto<InstagramMediaResponseDto>> {
    const result = await this.instagramService.publishPost(dto);
    return new ApiResponseDto(
      200,
      'Post published to Instagram successfully',
      result,
    );
  }

  @Post('publish-reel')
  @ApiOperation({
    summary: 'Publish reel (video) to Instagram',
    description:
      'Publish a reel/video to Instagram Business Account. Requires video URL.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reel published successfully',
    type: InstagramMediaResponseDto,
  })
  @ApiBody({ type: PublishInstagramReelDto })
  async publishReel(
    @Body() dto: PublishInstagramReelDto,
  ): Promise<ApiResponseDto<InstagramMediaResponseDto>> {
    const result = await this.instagramService.publishReel(dto);
    return new ApiResponseDto(
      200,
      'Reel published to Instagram successfully',
      result,
    );
  }

  @Get('insights/:mediaId')
  @ApiOperation({
    summary: 'Get Instagram post insights',
    description:
      'Get metrics for an Instagram post (likes, comments, reach, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Insights retrieved successfully',
    type: InstagramInsightsDto,
  })
  async getInsights(
    @Param('mediaId') mediaId: string,
    @Query('access_token') accessToken: string,
  ): Promise<ApiResponseDto<InstagramInsightsDto>> {
    const result = await this.instagramService.getPostInsights(
      mediaId,
      accessToken,
    );
    return new ApiResponseDto(200, 'Insights retrieved successfully', result);
  }

  @Get('account/:instagramAccountId')
  @ApiOperation({
    summary: 'Get Instagram account info',
    description: 'Get Instagram Business Account information',
  })
  @ApiResponse({
    status: 200,
    description: 'Account info retrieved successfully',
  })
  async getAccountInfo(
    @Param('instagramAccountId') instagramAccountId: string,
    @Query('access_token') accessToken: string,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.instagramService.getInstagramAccount(
      instagramAccountId,
      accessToken,
    );
    return new ApiResponseDto(
      200,
      'Account info retrieved successfully',
      result,
    );
  }
}
