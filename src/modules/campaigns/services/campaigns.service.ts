import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Campaign } from '../entities/campaign.entity';
import { CampaignPost } from '../entities/campaign-post.entity';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { ResponseCampaignDto, ResponseCampaignListDto } from '../dto/response-campaign.dto';
import { ResponseCampaignPostDto } from '../dto/response-campaign-post.dto';
import { RejectCampaignPostDto, UpdateCampaignPostScheduleDto } from '../dto/update-campaign-post.dto';
import { CampaignStatus, CampaignPostStatus, Platform } from 'src/enums/campaign.enum';
import { PostService } from '../../post/post.service';
import { PostStatus } from 'src/enums/post.enum';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignPost)
    private readonly campaignPostRepository: Repository<CampaignPost>,
    private readonly postService: PostService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(userId: string, dto: CreateCampaignDto): Promise<ResponseCampaignDto> {
    this.logger.log(`Creating campaign for user ${userId}`);

    const campaign = new Campaign();
    campaign.name = dto.name;
    campaign.description = dto.description || null;
    campaign.brandId = dto.brandId || null;
    campaign.status = CampaignStatus.DRAFT;
    campaign.targetPlatforms = dto.targetPlatforms;
    campaign.contentGuidelines = {
      tone: dto.contentGuidelines.tone,
      topics: dto.contentGuidelines.topics,
      keywords: dto.contentGuidelines.keywords,
      doNots: dto.contentGuidelines.doNots || [],
    };
    campaign.scheduleConfig = dto.scheduleConfig;
    campaign.aiConfig = dto.aiConfig;
    campaign.userId = userId;
    if (dto.startDate) {
      campaign.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      campaign.endDate = new Date(dto.endDate);
    }

    await this.campaignRepository.save(campaign);

    return plainToInstance(ResponseCampaignDto, campaign, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: CampaignStatus,
  ): Promise<ResponseCampaignListDto> {
    const query = this.campaignRepository
      .createQueryBuilder('campaign')
      .where('campaign.userId = :userId', { userId })
      .orderBy('campaign.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      query.andWhere('campaign.status = :status', { status });
    }

    const [campaigns, total] = await query.getManyAndCount();

    return {
      data: plainToInstance(ResponseCampaignDto, campaigns, {
        excludeExtraneousValues: true,
      }),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, userId: string): Promise<ResponseCampaignDto> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['brand'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this campaign');
    }

    return plainToInstance(ResponseCampaignDto, campaign, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateCampaignDto,
  ): Promise<ResponseCampaignDto> {
    const campaign = await this.campaignRepository.findOne({ where: { id } });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this campaign');
    }

    Object.assign(campaign, dto);

    if (dto.startDate) {
      campaign.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      campaign.endDate = new Date(dto.endDate);
    }

    await this.campaignRepository.save(campaign);

    return plainToInstance(ResponseCampaignDto, campaign, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const campaign = await this.campaignRepository.findOne({ where: { id } });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this campaign');
    }

    await this.campaignRepository.remove(campaign);
  }

  // Campaign Posts Management
  async findCampaignPosts(
    campaignId: string,
    userId: string,
    status?: CampaignPostStatus,
  ): Promise<ResponseCampaignPostDto[]> {
    const campaign = await this.findOne(campaignId, userId);

    const query = this.campaignPostRepository
      .createQueryBuilder('post')
      .where('post.campaignId = :campaignId', { campaignId })
      .orderBy('post.createdAt', 'DESC');

    if (status) {
      query.andWhere('post.status = :status', { status });
    }

    const posts = await query.getMany();

    return plainToInstance(ResponseCampaignPostDto, posts, {
      excludeExtraneousValues: true,
    });
  }

  async findCampaignPost(
    campaignId: string,
    postId: string,
    userId: string,
  ): Promise<ResponseCampaignPostDto> {
    await this.findOne(campaignId, userId);

    const post = await this.campaignPostRepository.findOne({
      where: { id: postId, campaignId },
    });

    if (!post) {
      throw new NotFoundException('Campaign post not found');
    }

    return plainToInstance(ResponseCampaignPostDto, post, {
      excludeExtraneousValues: true,
    });
  }

  async approveCampaignPost(
    campaignId: string,
    postId: string,
    userId: string,
  ): Promise<ResponseCampaignPostDto> {
    await this.findOne(campaignId, userId);

    const post = await this.campaignPostRepository.findOne({
      where: { id: postId, campaignId },
    });

    if (!post) {
      throw new NotFoundException('Campaign post not found');
    }

    if (post.status !== CampaignPostStatus.DRAFT) {
      throw new ForbiddenException('Only draft posts can be approved');
    }

    // Upload base64 images to Cloudinary and replace with URLs
    if (post.images && post.images.length > 0) {
      this.logger.log(`[Approve] Uploading ${post.images.length} images to Cloudinary`);
      const cloudinaryUrls: string[] = [];

      for (let i = 0; i < post.images.length; i++) {
        const imageData = post.images[i];

        // Skip if already a Cloudinary URL or HTTP URL
        if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
          this.logger.log(`[Approve] Image ${i + 1} is already a URL, keeping: ${imageData.substring(0, 100)}...`);
          cloudinaryUrls.push(imageData);
          continue;
        }

        // Skip empty or invalid images
        if (!imageData || imageData.trim().length === 0) {
          this.logger.warn(`[Approve] Image ${i + 1} is empty, skipping`);
          continue;
        }

        try {
          let base64Data = imageData;

          // Handle data URL format: data:image/png;base64,xxxxx
          if (imageData.startsWith('data:image/')) {
            const base64Index = imageData.indexOf(',');
            if (base64Index === -1 || base64Index === imageData.length - 1) {
              this.logger.warn(`[Approve] Image ${i + 1} has invalid data URL format (missing content after comma), skipping`);
              continue;
            }
            base64Data = imageData.substring(base64Index + 1);
            
            if (base64Data.length < 10) {
              this.logger.warn(`[Approve] Image ${i + 1} has no content after comma, skipping`);
              continue;
            }
          } else {
            // Raw base64 - validate length
            if (base64Data.length < 100) {
              this.logger.warn(`[Approve] Image ${i + 1} appears to be invalid raw base64 (too short), skipping`);
              continue;
            }
          }

          this.logger.log(`[Approve] Uploading image ${i + 1}/${post.images.length} to Cloudinary...`);

          // Upload to Cloudinary (only pure base64 string without data:image prefix)
          const uploadResult = await this.cloudinaryService.uploadBase64(
            base64Data,
            'campaigns',
          );

          this.logger.log(`[Approve] Image ${i + 1} uploaded successfully: ${uploadResult.secure_url}`);
          cloudinaryUrls.push(uploadResult.secure_url);
        } catch (error) {
          this.logger.error(`[Approve] Failed to upload image ${i + 1}:`, error.message);
          // Skip failed uploads, don't throw error
        }
      }

      // Replace images array with Cloudinary URLs only
      post.images = cloudinaryUrls;
      this.logger.log(`[Approve] Replaced images with ${cloudinaryUrls.length} Cloudinary URLs`);
    }

    post.status = CampaignPostStatus.APPROVED;
    post.reviewedBy = userId;
    post.reviewedAt = new Date();

    await this.campaignPostRepository.save(post);

    return plainToInstance(ResponseCampaignPostDto, post, {
      excludeExtraneousValues: true,
    });
  }

  async rejectCampaignPost(
    campaignId: string,
    postId: string,
    userId: string,
    dto: RejectCampaignPostDto,
  ): Promise<ResponseCampaignPostDto> {
    await this.findOne(campaignId, userId);

    const post = await this.campaignPostRepository.findOne({
      where: { id: postId, campaignId },
    });

    if (!post) {
      throw new NotFoundException('Campaign post not found');
    }

    if (post.status !== CampaignPostStatus.DRAFT) {
      throw new ForbiddenException('Only draft posts can be rejected');
    }

    post.status = CampaignPostStatus.REJECTED;
    post.reviewedBy = userId;
    post.reviewedAt = new Date();
    post.rejectionReason = dto.reason || 'No reason provided';

    await this.campaignPostRepository.save(post);

    return plainToInstance(ResponseCampaignPostDto, post, {
      excludeExtraneousValues: true,
    });
  }

  async getCampaignAnalytics(campaignId: string, userId: string) {
    const campaign = await this.findOne(campaignId, userId);

    const posts = await this.campaignPostRepository.find({
      where: { campaignId },
    });

    const analytics = {
      totalPosts: posts.length,
      draftPosts: posts.filter((p) => p.status === CampaignPostStatus.DRAFT).length,
      approvedPosts: posts.filter((p) => p.status === CampaignPostStatus.APPROVED).length,
      scheduledPosts: posts.filter((p) => p.status === CampaignPostStatus.SCHEDULED).length,
      publishedPosts: posts.filter((p) => p.status === CampaignPostStatus.PUBLISHED).length,
      rejectedPosts: posts.filter((p) => p.status === CampaignPostStatus.REJECTED).length,
      totalMetrics: {
        likes: 0,
        comments: 0,
        shares: 0,
        reach: 0,
      },
    };

    // Calculate total metrics from published posts
    posts.forEach((post) => {
      if (post.publishedPosts && post.publishedPosts.length > 0) {
        post.publishedPosts.forEach((pp) => {
          if (pp.metrics) {
            analytics.totalMetrics.likes += pp.metrics.likes || 0;
            analytics.totalMetrics.comments += pp.metrics.comments || 0;
            analytics.totalMetrics.shares += pp.metrics.shares || 0;
            analytics.totalMetrics.reach += pp.metrics.reach || 0;
          }
        });
      }
    });

    return analytics;
  }

  async updateCampaignPostSchedule(
    campaignId: string,
    postId: string,
    userId: string,
    dto: UpdateCampaignPostScheduleDto,
  ): Promise<ResponseCampaignPostDto> {
    // Find and validate campaign post
    const postEntity = await this.campaignPostRepository.findOne({
      where: { id: postId, campaignId },
      relations: ['campaign'],
    });

    if (!postEntity) {
      throw new NotFoundException('Campaign post not found');
    }

    // Validate ownership
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
    });

    if (!campaign || campaign.userId !== userId) {
      throw new ForbiddenException('You do not have permission to schedule this post');
    }

    // Validate that post is approved before scheduling
    if (postEntity.status !== CampaignPostStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved posts can be scheduled. Please approve the post first.',
      );
    }

    // Validate required fields
    if (!dto.scheduledTime) {
      throw new BadRequestException('Scheduled time is required');
    }

    if (!dto.socialAccountIds || dto.socialAccountIds.length === 0) {
      throw new BadRequestException(
        'At least one social account ID is required to schedule the post',
      );
    }

    // Validate scheduled time is in the future
    const scheduledTime = new Date(dto.scheduledTime);
    if (scheduledTime <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    this.logger.log(
      `Scheduling campaign post ${postId} for ${scheduledTime.toISOString()} to ${dto.socialAccountIds.length} social accounts`,
    );
    this.logger.log(
      `Social account IDs: [${dto.socialAccountIds.join(', ')}]`,
    );

    // Create a regular Post entity to leverage existing scheduling infrastructure
    // PostService.create() will automatically:
    // 1. Create Post entity
    // 2. Create PostSocialAccount entries for each social account
    // 3. Emit SCHEDULE_POST event for background job to handle
    const createPostData = {
      content: postEntity.content,
      image: postEntity.images || [],
      hashtag_collection: postEntity.hashtags || [],
      category_id: undefined, // Campaign posts don't need category
      brand_id: campaign.brandId || undefined,
      social_account_ids: dto.socialAccountIds, // CRITICAL: Pass social accounts for scheduling
      date_post: scheduledTime,
      post_now: false,
      status: PostStatus.SCHEDULED,
    };

    this.logger.log(
      `CreatePost payload: date_post=${createPostData.date_post?.toISOString()}, post_now=${createPostData.post_now}, status=${createPostData.status}`,
    );

    await this.postService.create(userId, createPostData);

    // Update campaign post status
    postEntity.status = CampaignPostStatus.SCHEDULED;
    postEntity.publishedPosts = postEntity.publishedPosts || [];

    // Track scheduling info for each social account
    dto.socialAccountIds.forEach((accountId) => {
      postEntity.publishedPosts.push({
        platform: Platform.FACEBOOK, // Will be determined by social account type
        postId: accountId,
        platformPostId: '', // Will be filled after actual posting
        publishedAt: scheduledTime,
        metrics: { likes: 0, comments: 0, shares: 0, reach: 0 },
      });
    });

    await this.campaignPostRepository.save(postEntity);

    // Update campaign metrics
    campaign.metrics.scheduledPosts = (campaign.metrics.scheduledPosts || 0) + 1;
    await this.campaignRepository.save(campaign);

    this.logger.log(
      `Successfully scheduled campaign post ${postId}. Post module will handle publishing at ${scheduledTime.toISOString()}`,
    );

    return plainToInstance(ResponseCampaignPostDto, postEntity, {
      excludeExtraneousValues: true,
    });
  }
}
