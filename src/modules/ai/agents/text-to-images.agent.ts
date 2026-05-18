import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai.service';
import { CreateChatAiImageDto } from '../dto/create-ai.dto';
import { ResponseTextToImagesDto } from '../dto/response-ai.dto';

@Injectable()
export class TextToImagesAgent {
  private readonly logger = new Logger(TextToImagesAgent.name);
  constructor(private readonly aiService: AiService) {}

  async askTextToImageWithHuggingFace(
    body: CreateChatAiImageDto,
  ): Promise<ResponseTextToImagesDto> {
    try {
      const { message, number_of_images } = body;
      const images: string[] = [];
      for (let i = 0; i < number_of_images; i++) {
        const seed = Math.floor(Math.random() * 999999);
        const image = await this.aiService.textToImageWithHuggingFace(
          message,
          seed,
        );
        images.push(image);
      }

      const responseTextToImagesDto = new ResponseTextToImagesDto();
      responseTextToImagesDto.images = images;
      return responseTextToImagesDto;
    } catch (error) {
      this.logger.error('Error in askTextToImageWithHuggingFace:', error);
      throw new Error(`Hugging Face API error: ${error.message}`);
    }
  }
}
