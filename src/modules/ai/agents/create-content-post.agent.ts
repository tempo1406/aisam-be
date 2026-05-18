import { Injectable } from '@nestjs/common';
import { AiService } from '../ai.service';
import { GenerateContentPostDto } from '../dto/generate-content-post.dto';

@Injectable()
export class CreateContentPostAgent {
  constructor(private readonly aiService: AiService) {}

  async askCreateContentPostAgent(
    body: GenerateContentPostDto,
  ): Promise<string[]> {
    const brandInfo = body.brand
      ? `
      **THÔNG TIN THƯƠNG HIỆU:**
      - Tên thương hiệu: ${body.brand.name}
      - Slogan: ${body.brand.slogan}
      - Mô tả chính: ${body.brand.main_description}
      - Nhân vật đại diện: ${body.brand.representative_character_name}
      - Mô tả nhân vật đại diện: ${body.brand.representative_character_description}
      - Website: ${body.brand.web_url}
      `
      : '';

    const categoryInfo = body.category
      ? `
      **DANH MỤC SẢN PHẨM/DỊCH VỤ:**
      - Tên danh mục: ${body.category.name}
      - Mô tả danh mục: ${body.category.descriptions}
      `
      : '';

    const hashtagInfo = body.hashtag_collection
      ? `
      **BỘ SƯU TẬP HASHTAG CÓ SẴN:**
      - Tên bộ sưu tập: ${body.hashtag_collection.collection_name}
      - Mô tả: ${body.hashtag_collection.collection_description}
      - Danh sách hashtag: ${body.hashtag_collection.list_hashtag.join(', ')}
      `
      : '';

    const prompt = `
      Bạn là một chuyên gia marketing và copywriter chuyên nghiệp. 
      Hãy tạo ra đúng ${body.number_of_content} bài viết quảng cáo chất lượng cao và đa dạng bằng tiếng ${
        body.language === 'vi' ? 'Việt' : 'Anh'
      }.

      ${brandInfo}
      ${categoryInfo}
      ${hashtagInfo}

      **YÊU CẦU NGƯỜI DÙNG:**
      ${body.user_prompt}

      **QUY TẮC NỘI DUNG:**
      - Giữ tone: ${body.tone_of_content}
      - Độ dài khoảng ${body.length_of_content} từ cho mỗi bài viết
      - Mỗi bài viết phải khác biệt hoàn toàn về phong cách và ý tưởng
      - Dễ đọc trên mobile, phù hợp đăng web/Facebook
      - Emoji vừa phải, tự nhiên
      - ${
        body.is_generate_hashtag
          ? `Mỗi bài viết kết thúc bằng 5–10 hashtag (ưu tiên hashtag có sẵn + hashtag trending/niche)`
          : 'Không tạo hashtag'
      }
      - ${
        body.isHaveIcon
          ? `Mỗi bài viết có icon phù hợp với nội dung của bàn viết, không được 
        thêm những cái không liên quan`
          : 'Không có icon'
      }

      **ĐỊNH DẠNG BẮT BUỘC:**
      - Trả về duy nhất một JSON array (không text ngoài array).
      - Mỗi phần tử trong array là một chuỗi chứa toàn bộ nội dung của bài viết.
      - Không thêm số thứ tự, không thêm tiêu đề, không thêm chú thích.

      Ví dụ output (minh hoạ):
      [
        "Bài viết 1...",
        "Bài viết 2...",
        "Bài viết 3..."
      ]

      Hãy trả về JSON array hợp lệ ngay bây giờ.
      `;

    const result = await this.aiService.askTextToTextAgent([
      { role: 'user', content: prompt },
    ]);

    const raw = result.trim();

    // Bỏ ```json và ```
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();

    let posts: string[];
    try {
      posts = JSON.parse(cleaned);
    } catch (e) {
      console.log(e);
      throw new Error('AI không trả về JSON hợp lệ');
    }
    return posts;
  }
}
