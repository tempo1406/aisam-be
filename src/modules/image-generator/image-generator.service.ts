import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';

interface GenerateImageOptions {
  prompt: string;
  style?: string;
  width?: number;
  height?: number;
  negativePrompt?: string;
}

@Injectable()
export class ImageGeneratorService {
  private readonly logger = new Logger(ImageGeneratorService.name);
  private readonly huggingfaceApiKey: string;
  private readonly huggingfaceApiUrl: string;

  constructor(private configService: ConfigService) {
    this.huggingfaceApiKey = this.configService.get<string>('huggingface.apiKey') || '';
    this.huggingfaceApiUrl =
      this.configService.get<string>('huggingface.apiUrl') ||
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
  }

  async generateImage(options: GenerateImageOptions): Promise<string> {
    try {
      this.logger.log(`Generating image with prompt: ${options.prompt}`);

      const enhancedPrompt = this.enhancePrompt(options.prompt, options.style);

      const response = await fetch(this.huggingfaceApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.huggingfaceApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: enhancedPrompt,
          parameters: {
            negative_prompt: options.negativePrompt || 'low quality, blurry, distorted',
            width: options.width || 1024,
            height: options.height || 1024,
            num_inference_steps: 50,
            guidance_scale: 7.5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.statusText}`);
      }

      const imageBuffer = await response.buffer();
      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:image/png;base64,${base64Image}`;

      this.logger.log('Image generated successfully');
      return imageUrl;
    } catch (error) {
      this.logger.error('Failed to generate image:', error);
      // Return placeholder image URL
      return 'https://via.placeholder.com/1024x1024.png?text=Image+Generation+Failed';
    }
  }

  private enhancePrompt(prompt: string, style?: string): string {
    let enhanced = prompt;

    if (style) {
      const styleEnhancements = {
        realistic: 'photorealistic, high quality, detailed, professional photography',
        artistic: 'artistic, creative, vibrant colors, stylized',
        minimalist: 'minimalist, clean, simple, elegant design',
        modern: 'modern, contemporary, sleek, professional',
        vintage: 'vintage, retro, nostalgic, classic style',
        abstract: 'abstract, creative, artistic interpretation',
      };

      const enhancement = styleEnhancements[style.toLowerCase()] || '';
      enhanced = `${prompt}, ${enhancement}`;
    }

    return enhanced;
  }

  async generateMultipleImages(
    prompts: string[],
    options: Partial<GenerateImageOptions> = {},
  ): Promise<string[]> {
    const images = await Promise.all(
      prompts.map((prompt) =>
        this.generateImage({
          ...options,
          prompt,
        }),
      ),
    );

    return images;
  }
}
