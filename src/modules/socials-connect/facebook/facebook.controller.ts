import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';
import { Public } from '@decorators/auth/public.decorator';
import { CreatePostPhotosFacebookDto } from './dtos/create-post.dto';
import {
  GetInforPlatformDto,
  GetInforPlatformResponseDto,
} from './dtos/get-infor-platform';

@Controller({
  path: 'facebook',
  version: '1',
})
@ApiTags('Facebook')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard)
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

  @Public()
  @Get('get-page-info')
  @ApiOperation({ summary: 'Get page info' })
  @ApiResponse({
    status: 200,
    description: 'Get page info successfully',
    type: GetInforPlatformResponseDto,
  })
  async getPageInfo(
    @Query() query: GetInforPlatformDto,
  ): Promise<ApiResponseDto<GetInforPlatformResponseDto>> {
    const result = await this.facebookService.getPageInfo(query);
    return new ApiResponseDto(200, 'Get page info successfully', result);
  }

  @Public()
  @Post('publish-photo')
  @ApiOperation({ summary: 'Publish photo' })
  @ApiResponse({ status: 200, description: 'Publish photo successfully' })
  @ApiBody({ type: CreatePostPhotosFacebookDto })
  async publishPhoto(
    @Body() body: CreatePostPhotosFacebookDto,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.facebookService.publishPostPhotos(body);
    return new ApiResponseDto(200, 'Publish photo successfully', result);
  }
}
