import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignPost } from '../entities/campaign-post.entity';
import { AgentRun } from '../entities/agent-run.entity';
import { GeneratePostsDto } from '../dto/generate-posts.dto';
import { AgentRunStatus, CampaignPostStatus, Platform, AIModel } from 'src/enums/campaign.enum';
import { AiService } from 'src/modules/ai/ai.service';
import { ImageGeneratorService } from 'src/modules/image-generator/image-generator.service';
import { BrandsService } from 'src/modules/brands/brands.service';
import { GeminiModel } from '@constants/gemini-model.constant';

interface PlatformVariant {
  platform: Platform;
  content: string;
  hashtags: string[];
  notes?: string;
}

@Injectable()
export class CampaignAiAgentService {
  private readonly logger = new Logger(CampaignAiAgentService.name);

  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignPost)
    private readonly campaignPostRepository: Repository<CampaignPost>,
    @InjectRepository(AgentRun)
    private readonly agentRunRepository: Repository<AgentRun>,
    private readonly aiService: AiService,
    private readonly imageGeneratorService: ImageGeneratorService,
    private readonly brandsService: BrandsService,
  ) {}

  /**
   * Convert AIModel enum to GeminiModel constant
   */
  private mapAIModelToGeminiModel(aiModel: AIModel): GeminiModel {
    switch (aiModel) {
      case AIModel.GEMINI:
        return GeminiModel.GEMINI_2_5_FLASH;
      default:
        return GeminiModel.GEMINI_2_5_FLASH;
    }
  }

  async generatePosts(
    campaignId: string,
    userId: string,
    dto: GeneratePostsDto,
  ): Promise<{ agentRunId: string; message: string }> {
    const startTime = Date.now();

    // Create agent run record
    const agentRun = this.agentRunRepository.create({
      campaignId,
      userId,
      status: AgentRunStatus.RUNNING,
      inputParameters: {
        numberOfPosts: dto.numberOfPosts,
        dateRange: {
          from: dto.dateRange.from,
          to: dto.dateRange.to,
        },
        platforms: dto.platforms,
      },
    });
    await this.agentRunRepository.save(agentRun);

    // Process generation asynchronously
    this.processGeneration(agentRun.id, campaignId, userId, dto, startTime).catch((error) => {
      this.logger.error(`Failed to generate posts for campaign ${campaignId}:`, error);
      this.updateAgentRunError(agentRun.id, error.message);
    });

    return {
      agentRunId: agentRun.id,
      message: 'Post generation started. You will be notified when complete.',
    };
  }

  private async processGeneration(
    agentRunId: string,
    campaignId: string,
    userId: string,
    dto: GeneratePostsDto,
    startTime: number,
  ): Promise<void> {
    try {
      // Load campaign and brand
      const campaign = await this.campaignRepository.findOne({
        where: { id: campaignId },
        relations: ['brand'],
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const brand = campaign.brand;

      // Generate content ideas
      const contentIdeas = await this.generateContentIdeas(campaign, dto.numberOfPosts);

      const generatedPostIds: string[] = [];
      let totalCost = 0;

      // Generate each post
      for (const idea of contentIdeas) {
        try {
          // Generate platform-specific content
          const platformVariants = await this.generatePlatformVariants(
            campaign,
            idea,
            dto.platforms,
          );

          // Generate images
          const images = await this.generateImages(campaign, idea, brand);

          // Calculate suggested schedule
          const suggestedSchedule = this.calculatePostSchedule(
            campaign,
            dto.dateRange,
            contentIdeas.indexOf(idea),
            dto.numberOfPosts,
          );

          // Create campaign post
          const post = new CampaignPost();
          post.campaignId = campaignId;
          post.userId = userId;
          post.content = idea.mainContent;
          post.images = images;
          post.hashtags = idea.hashtags;
          post.platformVariants = platformVariants.reduce((acc, pv) => {
            acc[pv.platform] = {
              content: pv.content,
              hashtags: pv.hashtags,
            };
            return acc;
          }, {});
          post.suggestedSchedule = suggestedSchedule.map((s) => ({
            platform: s.platform,
            scheduledTime: s.scheduledAt,
            priority: 1,
          }));
          // Always create posts as DRAFT - users must manually approve before publishing
          post.status = CampaignPostStatus.DRAFT;
          post.aiMetadata = {
            model: campaign.aiConfig.model,
            creativity: campaign.aiConfig.creativity,
            imageStyle: campaign.aiConfig.imageStyle,
            generatedAt: new Date().toISOString(),
          };

          await this.campaignPostRepository.save(post);
          generatedPostIds.push(post.id);

          // Estimate cost (rough approximation)
          totalCost += 0.01; // $0.01 per post generation
        } catch (error) {
          this.logger.error(`Failed to generate individual post:`, error);
          // Continue with next post
        }
      }

      // Update agent run with success
      const executionTime = Date.now() - startTime;
      const agentRun = await this.agentRunRepository.findOne({ where: { id: agentRunId } });
      if (agentRun) {
        agentRun.status = AgentRunStatus.COMPLETED;
        agentRun.output = {
          generatedPostIds,
          totalCost,
          executionTime,
          summary: `Successfully generated ${generatedPostIds.length} posts`,
        };
        agentRun.completedAt = new Date();
        await this.agentRunRepository.save(agentRun);
      }

      // Update campaign metrics
      await this.updateCampaignMetrics(campaignId);

      this.logger.log(
        `Successfully generated ${generatedPostIds.length} posts for campaign ${campaignId}`,
      );
    } catch (error) {
      await this.updateAgentRunError(agentRunId, error.message);
      throw error;
    }
  }

  private async generateContentIdeas(
    campaign: Campaign,
    count: number,
  ): Promise<Array<{ mainContent: string; hashtags: string[]; imagePrompt: string }>> {
    const { contentGuidelines } = campaign;

    const prompt = `
You are a social media content strategist. Generate ${count} creative post ideas based on these guidelines:

Campaign: ${campaign.name}
Description: ${campaign.description}

Content Tone: ${contentGuidelines.tone}
Topics to cover: ${contentGuidelines.topics.join(', ')}
Keywords to include: ${contentGuidelines.keywords.join(', ')}
${contentGuidelines.doNots.length > 0 ? `DO NOT mention: ${contentGuidelines.doNots.join(', ')}` : ''}

For each post idea, provide:
1. Main content (engaging post text, 150-200 words)
2. 5-8 relevant hashtags
3. Image description/prompt for visual content

Format your response as a JSON array with objects containing: mainContent, hashtags, imagePrompt
`.trim();

    try {
      const response = await this.aiService.askTextToTextAgent(
        [
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          model: this.mapAIModelToGeminiModel(campaign.aiConfig.model),
          temperature: campaign.aiConfig.creativity,
        },
      );

      // Parse AI response
      const ideas = this.parseContentIdeas(response, count);
      return ideas;
    } catch (error) {
      this.logger.error('Failed to generate content ideas:', error);
      // Fallback to template-based generation
      return this.generateFallbackIdeas(campaign, count);
    }
  }

  private parseContentIdeas(
    response: string,
    count: number,
  ): Array<{ mainContent: string; hashtags: string[]; imagePrompt: string }> {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;

      const parsed = JSON.parse(jsonStr);
      const ideas = Array.isArray(parsed) ? parsed : [parsed];

      return ideas.slice(0, count).map((idea) => ({
        mainContent: idea.mainContent || idea.content || '',
        hashtags: idea.hashtags || [],
        imagePrompt: idea.imagePrompt || idea.image || 'Professional business image',
      }));
    } catch (error) {
      this.logger.error('Failed to parse AI response:', error);
      return [];
    }
  }

  private generateFallbackIdeas(
    campaign: Campaign,
    count: number,
  ): Array<{ mainContent: string; hashtags: string[]; imagePrompt: string }> {
    const { contentGuidelines } = campaign;
    const ideas: Array<{ mainContent: string; hashtags: string[]; imagePrompt: string }> = [];

    for (let i = 0; i < count; i++) {
      ideas.push({
        mainContent: `${campaign.name} - Post ${i + 1}\n\nExploring ${contentGuidelines.topics[i % contentGuidelines.topics.length]} with insights and value for our audience.`,
        hashtags: contentGuidelines.keywords.slice(0, 5).map((k) => `#${k}`),
        imagePrompt: `Professional ${contentGuidelines.topics[i % contentGuidelines.topics.length]} image`,
      });
    }

    return ideas;
  }

  private async generatePlatformVariants(
    campaign: Campaign,
    idea: { mainContent: string; hashtags: string[] },
    platforms: Platform[],
  ): Promise<PlatformVariant[]> {
    const variants: PlatformVariant[] = [];

    for (const platform of platforms) {
      const variant = await this.adaptContentForPlatform(
        platform,
        idea.mainContent,
        idea.hashtags,
        campaign.contentGuidelines.tone,
      );
      variants.push(variant);
    }

    return variants;
  }

  private async adaptContentForPlatform(
    platform: Platform,
    content: string,
    hashtags: string[],
    tone: string,
  ): Promise<PlatformVariant> {
    const adaptations = {
      [Platform.FACEBOOK]: {
        maxLength: 500,
        style: 'longer, more detailed with storytelling',
        hashtagLimit: 3,
      },
      [Platform.INSTAGRAM]: {
        maxLength: 300,
        style: 'visual-focused, use emojis, lifestyle oriented',
        hashtagLimit: 10,
      },
      [Platform.TIKTOK]: {
        maxLength: 150,
        style: 'short, catchy, trend-focused with hooks',
        hashtagLimit: 5,
      },

    };

    const config = adaptations[platform];
    const adaptedContent =
      content.length > config.maxLength ? content.substring(0, config.maxLength) + '...' : content;

    const adaptedHashtags = hashtags.slice(0, config.hashtagLimit);

    return {
      platform,
      content: adaptedContent,
      hashtags: adaptedHashtags,
      notes: `Optimized for ${platform}: ${config.style}`,
    };
  }

  private async generateImages(
    campaign: Campaign,
    idea: { imagePrompt: string },
    brand: any,
  ): Promise<string[]> {
    try {
      const imagePrompt = `${idea.imagePrompt}. Style: ${campaign.aiConfig.imageStyle}. Brand: ${brand.name}`;

      // Use Hugging Face FLUX model for image generation
      const imageDataUrl = await this.aiService.textToImageWithHuggingFace(
        imagePrompt,
        Date.now(), // Use timestamp as seed for unique images
      );

      return [imageDataUrl];
    } catch (error) {
      this.logger.error('Failed to generate image with Hugging Face FLUX:', error);
      return ['https://via.placeholder.com/1024x1024.png?text=Image+Generation+Failed'];
    }
  }

  private calculatePostSchedule(
    campaign: Campaign,
    dateRange: { from: string; to: string },
    postIndex: number,
    totalPosts: number,
  ): Array<{ platform: Platform; scheduledAt: Date }> {
    const schedule: Array<{ platform: Platform; scheduledAt: Date }> = [];
    const { scheduleConfig, targetPlatforms } = campaign;

    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate spacing between posts
    const daysPerPost = Math.floor(daysDiff / totalPosts);
    const postDate = new Date(startDate);
    postDate.setDate(startDate.getDate() + postIndex * daysPerPost);

    // Get preferred time for this day
    const preferredTime = scheduleConfig.preferredTimes[0] || '09:00';
    const [hours, minutes] = preferredTime.split(':').map(Number);
    postDate.setHours(hours, minutes, 0, 0);

    // Create schedule entry for each target platform
    targetPlatforms.forEach((platform) => {
      schedule.push({
        platform,
        scheduledAt: new Date(postDate),
      });
    });

    return schedule;
  }

  private async updateCampaignMetrics(campaignId: string): Promise<void> {
    const posts = await this.campaignPostRepository.find({
      where: { campaignId },
    });

    const metrics = {
      totalPosts: posts.length,
      approvedPosts: posts.filter((p) => p.status === CampaignPostStatus.APPROVED).length,
      publishedPosts: posts.filter((p) => p.status === CampaignPostStatus.PUBLISHED).length,
      scheduledPosts: posts.filter((p) => p.status === CampaignPostStatus.SCHEDULED).length,
    };

    const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });
    if (campaign) {
      campaign.metrics = metrics;
      await this.campaignRepository.save(campaign);
    }
  }

  private async updateAgentRunError(agentRunId: string, errorMessage: string): Promise<void> {
    const agentRun = await this.agentRunRepository.findOne({ where: { id: agentRunId } });
    if (agentRun) {
      agentRun.status = AgentRunStatus.FAILED;
      agentRun.errorMessage = errorMessage;
      agentRun.completedAt = new Date();
      await this.agentRunRepository.save(agentRun);
    }
  }

  async getAgentRun(agentRunId: string, userId: string): Promise<AgentRun> {
    const agentRun = await this.agentRunRepository.findOne({
      where: { id: agentRunId, userId },
    });

    if (!agentRun) {
      throw new Error('Agent run not found');
    }

    return agentRun;
  }

  async getAgentRunHistory(campaignId: string, userId: string): Promise<AgentRun[]> {
    return this.agentRunRepository.find({
      where: { campaignId, userId },
      order: { createdAt: 'DESC' },
    });
  }
}
