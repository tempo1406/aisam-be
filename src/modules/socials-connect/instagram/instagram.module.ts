import { Module, forwardRef } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { InstagramController } from './instagram.controller';
import { HttpModule } from '@nestjs/axios';
import { SocialModule } from '@modules/social/social.module';

@Module({
  imports: [HttpModule, forwardRef(() => SocialModule)],
  controllers: [InstagramController],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
