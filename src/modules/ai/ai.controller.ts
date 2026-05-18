import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@decorators/auth/public.decorator';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { ChatMessage } from './types/ai.type';
import { CreateChatAiDto, CreateChatAiImageDto } from './dto/create-ai.dto';
import { ResponseTextToImagesDto } from './dto/response-ai.dto';
import { TextToImagesAgent } from './agents/text-to-images.agent';

@ApiTags('AI')
@Controller({
  path: 'ai',
  version: '1',
})
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly textToImagesAgent: TextToImagesAgent,
  ) {}

  @Public()
  @Post('chat-text-to-text')
  @ApiOperation({ summary: 'Chat with AI' })
  @ApiResponse({ status: 200, description: 'Chat with AI', type: String })
  @ApiBody({ type: CreateChatAiDto })
  async create(
    @Body() createChatAiDto: CreateChatAiDto,
  ): Promise<ApiResponseDto<string>> {
    const messages = [
      { role: 'user', content: createChatAiDto.message },
    ] as ChatMessage[];
    const result = await this.aiService.askTextToTextAgent(messages);
    return new ApiResponseDto(200, 'Chat with AI', result);
  }

  @Public()
  @Post('chat-text-to-image')
  @ApiOperation({ summary: 'Chat with AI text to image' })
  @ApiResponse({
    status: 200,
    description: 'Chat with AI text to image',
    type: ResponseTextToImagesDto,
  })
  @ApiBody({ type: CreateChatAiImageDto })
  async createImage(
    @Body() createChatAiImageDto: CreateChatAiImageDto,
  ): Promise<ApiResponseDto<ResponseTextToImagesDto>> {
    const result =
      await this.textToImagesAgent.askTextToImageWithHuggingFace(
        createChatAiImageDto,
      );
    return new ApiResponseDto(200, 'Generate images successfully', result);
  }
}
