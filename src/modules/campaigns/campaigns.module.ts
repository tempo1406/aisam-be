import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './services/campaigns.service';
import { CampaignAiAgentService } from './services/campaign-ai-agent.service';
import { Campaign } from './entities/campaign.entity';
import { CampaignPost } from './entities/campaign-post.entity';
import { AgentRun } from './entities/agent-run.entity';
import { AiModule } from '../ai/ai.module';
import { BrandsModule } from '../brands/brands.module';
import { ImageGeneratorModule } from '../image-generator/image-generator.module';
import { PostModule } from '../post/post.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, CampaignPost, AgentRun]),
    JwtModule,
    AiModule,
    BrandsModule,
    ImageGeneratorModule,
    PostModule,
    CloudinaryModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignAiAgentService],
  exports: [CampaignsService, CampaignAiAgentService],
})
export class CampaignsModule {}
