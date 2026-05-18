import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { HttpModule } from '@nestjs/axios';
import { TextToImagesAgent } from './agents/text-to-images.agent';
import { CreateContentPostAgent } from './agents/create-content-post.agent';

@Module({
  imports: [HttpModule],
  controllers: [AiController],
  providers: [AiService, TextToImagesAgent, CreateContentPostAgent],
  exports: [AiService, TextToImagesAgent, CreateContentPostAgent],
})
export class AiModule {}
