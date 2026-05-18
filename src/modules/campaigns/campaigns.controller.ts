import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CampaignsService } from './services/campaigns.service';
import { CampaignAiAgentService } from './services/campaign-ai-agent.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { GeneratePostsDto } from './dto/generate-posts.dto';
import {
  UpdateCampaignPostScheduleDto,
  RejectCampaignPostDto,
} from './dto/update-campaign-post.dto';
import {
  ResponseCampaignDto,
  ResponseCampaignListDto,
} from './dto/response-campaign.dto';
import { ResponseCampaignPostDto } from './dto/response-campaign-post.dto';
import { JwtAuthGuard } from 'src/guards/jwt-guard/jwt.guard';
import { CampaignStatus, CampaignPostStatus } from 'src/enums/campaign.enum';

@ApiTags('Campaigns')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'campaigns',
  version: '1',
})
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly aiAgentService: CampaignAiAgentService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({
    status: 201,
    description: 'Campaign created successfully',
    type: ResponseCampaignDto,
  })
  async create(
    @Req() req: any,
    @Body(ValidationPipe) createCampaignDto: CreateCampaignDto,
  ): Promise<ResponseCampaignDto> {
    const user_id = req.user.sub as string;
    return this.campaignsService.create(user_id, createCampaignDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: CampaignStatus })
  @ApiResponse({
    status: 200,
    description: 'Campaigns retrieved successfully',
    type: ResponseCampaignListDto,
  })
  async findAll(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: CampaignStatus,
  ): Promise<ResponseCampaignListDto> {
    const userId = req.user.sub as string;
    return this.campaignsService.findAll(
      userId,
      page || 1,
      limit || 10,
      status,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign retrieved successfully',
    type: ResponseCampaignDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async findOne(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<ResponseCampaignDto> {
    const userId = req.user.sub as string;
    return this.campaignsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiResponse({
    status: 200,
    description: 'Campaign updated successfully',
    type: ResponseCampaignDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) updateCampaignDto: UpdateCampaignDto,
  ): Promise<ResponseCampaignDto> {
    const userId = req.user.sub as string;
    return this.campaignsService.update(id, userId, updateCampaignDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiResponse({ status: 200, description: 'Campaign deleted successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async remove(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = req.user.sub as string;
    return this.campaignsService.remove(id, userId);
  }

  // AI Post Generation
  @Post(':id/generate')
  @ApiOperation({ summary: 'Generate posts using AI agent' })
  @ApiResponse({
    status: 201,
    description: 'Post generation started',
    schema: {
      properties: {
        agentRunId: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  async generatePosts(
    @Req() req: any,
    @Param('id') campaignId: string,
    @Body(ValidationPipe) generatePostsDto: GeneratePostsDto,
  ): Promise<{ agentRunId: string; message: string }> {
    const userId = req.user.sub as string;
    return this.aiAgentService.generatePosts(
      campaignId,
      userId,
      generatePostsDto,
    );
  }

  // Campaign Posts Management
  @Get(':id/posts')
  @ApiOperation({ summary: 'Get all posts for a campaign' })
  @ApiQuery({ name: 'status', required: false, enum: CampaignPostStatus })
  @ApiResponse({
    status: 200,
    description: 'Campaign posts retrieved successfully',
    type: [ResponseCampaignPostDto],
  })
  async getCampaignPosts(
    @Req() req: any,
    @Param('id') campaignId: string,
    @Query('status') status?: CampaignPostStatus,
  ): Promise<ResponseCampaignPostDto[]> {
    const userId = req.user.sub as string;
    return this.campaignsService.findCampaignPosts(campaignId, userId, status);
  }

  @Get(':id/posts/:postId')
  @ApiOperation({ summary: 'Get a specific campaign post' })
  @ApiResponse({
    status: 200,
    description: 'Campaign post retrieved successfully',
    type: ResponseCampaignPostDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign post not found' })
  async getCampaignPost(
    @Req() req: any,
    @Param('id') campaignId: string,
    @Param('postId') postId: string,
  ): Promise<ResponseCampaignPostDto> {
    const userId = req.user.sub as string;
    return this.campaignsService.findCampaignPost(campaignId, postId, userId);
  }

  @Post(':id/posts/:postId/approve')
  @ApiOperation({ summary: 'Approve a campaign post' })
  @ApiResponse({
    status: 200,
    description: 'Post approved successfully',
    type: ResponseCampaignPostDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign post not found' })
  async approvePost(
    @Req() req: any,
    @Param('id') campaignId: string,
    @Param('postId') postId: string,
  ): Promise<ResponseCampaignPostDto> {
    const userId = req.user.sub as string;
    return this.campaignsService.approveCampaignPost(
      campaignId,
      postId,
      userId,
    );
  }

  @Post(':id/posts/:postId/reject')
  @ApiOperation({ summary: 'Reject a campaign post' })
  @ApiResponse({
    status: 200,
    description: 'Post rejected successfully',
    type: ResponseCampaignPostDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign post not found' })
  async rejectPost(
    @Req() req: any,
    @Param('id') campaignId: string,
    @Param('postId') postId: string,
    @Body(ValidationPipe) rejectDto: RejectCampaignPostDto,
  ): Promise<ResponseCampaignPostDto> {
    const userId = req.user.sub as string;
    return this.campaignsService.rejectCampaignPost(
      campaignId,
      postId,
      userId,
      rejectDto,
    );
  }

  @Patch(':id/posts/:postId/schedule')
  @ApiOperation({ summary: 'Update campaign post schedule' })
  @ApiResponse({
    status: 200,
    description: 'Schedule updated successfully',
    type: ResponseCampaignPostDto,
  })
  async updateSchedule(
    @Req() req: any,
    @Param('id') campaignId: string,
    @Param('postId') postId: string,
    @Body(ValidationPipe) scheduleDto: UpdateCampaignPostScheduleDto,
  ): Promise<ResponseCampaignPostDto> {
    const userId = req.user.sub as string;
    return this.campaignsService.updateCampaignPostSchedule(
      campaignId,
      postId,
      userId,
      scheduleDto,
    );
  }

  // Analytics
  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get campaign analytics' })
  @ApiResponse({
    status: 200,
    description: 'Campaign analytics retrieved successfully',
    schema: {
      properties: {
        totalPosts: { type: 'number' },
        draftPosts: { type: 'number' },
        approvedPosts: { type: 'number' },
        scheduledPosts: { type: 'number' },
        publishedPosts: { type: 'number' },
        rejectedPosts: { type: 'number' },
        totalMetrics: {
          type: 'object',
          properties: {
            likes: { type: 'number' },
            comments: { type: 'number' },
            shares: { type: 'number' },
            reach: { type: 'number' },
          },
        },
      },
    },
  })
  async getCampaignAnalytics(
    @Req() req: any,
    @Param('id') campaignId: string,
  ) {
    const userId = req.user.sub as string;
    return this.campaignsService.getCampaignAnalytics(campaignId, userId);
  }

  // Agent Run History
  @Get(':id/agent-runs')
  @ApiOperation({ summary: 'Get AI agent run history for campaign' })
  @ApiResponse({
    status: 200,
    description: 'Agent run history retrieved successfully',
  })
  async getAgentRunHistory(
    @Req() req: any,
    @Param('id') campaignId: string,
  ) {
    const userId = req.user.sub as string;
    return this.aiAgentService.getAgentRunHistory(campaignId, userId);
  }

  @Get(':id/agent-runs/:runId')
  @ApiOperation({ summary: 'Get specific agent run details' })
  @ApiResponse({
    status: 200,
    description: 'Agent run details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Agent run not found' })
  async getAgentRun(
    @Req() req: any,
    @Param('id') campaignId: string,
    @Param('runId') runId: string,
  ) {
    const userId = req.user.sub as string;
    return this.aiAgentService.getAgentRun(runId, userId);
  }
}
