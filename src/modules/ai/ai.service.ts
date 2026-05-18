import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage, ChatOptions, HistoryResultText } from './types/ai.type';
import { GeminiModel } from '@constants/gemini-model.constant';
import { Content, GoogleGenAI, Modality } from '@google/genai';
import { AllConfigType } from '@configs/config.type';
import { HuggingFaceModel } from '@constants/huggingface-model.constan';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private geminiText: GoogleGenAI;
  private geminiImage: GoogleGenAI;
  private huggingfaceApi: string;

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  onModuleInit() {
    const geminiApi = this.configService.get('geminiApi');
    this.geminiText = new GoogleGenAI({
      apiKey: geminiApi.api_key_text_to_text,
    });
    this.geminiImage = new GoogleGenAI({
      apiKey: geminiApi.api_key_text_to_image,
    });
    const huggingFaceApi = this.configService.get('huggingFaceApi');
    this.huggingfaceApi = huggingFaceApi.apiKey;
  }

  /**
   * Chat with Gemini - support pure text
   * @param messages
   * @param options
   * @returns
   */
  async askTextToTextAgent(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<string> {
    try {
      const modelId = options?.model || GeminiModel.GEMINI_2_5_FLASH;
      const temperature = options?.temperature ?? 0.7;
      const { history, latestMessage } = this.buildHistory(messages);

      const response = await this.geminiText.models.generateContent({
        model: modelId,
        contents: [
          ...history,
          {
            role: 'user',
            parts: [{ text: latestMessage }],
          },
        ],
        config: {
          temperature,
          maxOutputTokens: options?.maxTokens,
        },
      });

      // Send latest message
      const result = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return result;
    } catch (error) {
      this.logger.error('Error in askAgent:', error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * Chat with Gemini - support image
   * @param prompt
   * @returns
   */
  async askTextToImageAgent(prompt: string): Promise<Buffer | null> {
    try {
      const contents =
        prompt ||
        'Hi, can you create a 3D rendered image of a pig ' +
          'with wings and a top hat flying over a happy ' +
          'futuristic sci-fi city with lots of greenery? ';

      const response = await this.geminiImage.models.generateContent({
        model: GeminiModel.GEMINI_2_5_FLASH_IMAGE_PREVIEW,
        contents: contents,
        config: {
          responseModalities: [Modality.IMAGE],
          temperature: 0.7,
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];

      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image')) {
          const imageBase64 = part.inlineData.data;
          return Buffer.from(imageBase64 ?? '', 'base64');
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Error in askTextToImageAgent:', error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * Text to image with Hugging Face
   * @param prompt
   * @returns
   */
  async textToImageWithHuggingFace(
    prompt: string,
    seed?: number,
  ): Promise<string> {
    try {
      const url = `https://router.huggingface.co/hf-inference/models/${
        HuggingFaceModel.FLUX_1_SCHNELL
      }`;
      const config = {
        headers: {
          Authorization: `Bearer ${this.huggingfaceApi}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer' as const,
        timeout: 60000,
      };
      const data = {
        inputs: prompt,
        parameters: {
          num_inference_steps: 4,
          guidance_scale: 1.0,
          seed: seed,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: config.headers,
      });

      if (!response.ok) {
        if (response.status === 503) {
          console.log('⏳ Model is loading, trying again in 10 seconds...');
          await new Promise((resolve) => setTimeout(resolve, 10000));
          return await this.textToImageWithHuggingFace(prompt, seed);
        }
        throw new Error(`HTTP error! status: ${response?.status}`);
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      return `data:image/png;base64,${imageBuffer.toString('base64')}`;
    } catch (error) {
      this.logger.error('Error in askTextToImageAgentWithHuggingFace:', error);
      throw new Error(`Hugging Face API error: ${error.message}`);
    }
  }

  /**
   * Build history for Gemini
   * @param messages
   * @returns
   */
  private buildHistory(messages: ChatMessage[]): HistoryResultText {
    const history: Content[] = [];

    const systemPrompt = messages.find((m) => m.role === 'system')?.content;
    const chatHistory = messages.filter((m) => m.role !== 'system');

    if (systemPrompt) {
      history.push({ role: 'user', parts: [{ text: systemPrompt }] });
      history.push({
        role: 'model',
        parts: [{ text: 'Tôi đã hiểu. Tôi sẽ tuân thủ các hướng dẫn này.' }],
      });
    }

    chatHistory.forEach((msg) => {
      history.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    });

    const latestMessage = chatHistory.at(-1)?.content || '';

    return { history, latestMessage };
  }
}
