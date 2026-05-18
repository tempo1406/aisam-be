import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../../enums/notification.enum';
import { Post } from '../../post/entities/post.entity';

@Injectable()
export class NotificationEventListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  @OnEvent('post.created')
  async handlePostCreated(payload: { userId: string }) {
    console.log('NotificationEventListener received post.created:', payload);
    try {
      if (!payload.userId) {
        console.log('No userId provided, skipping notification');
        return;
      }

      // Query latest post by this user
      const latestPost = await this.postRepository.findOne({
        where: { user_id: payload.userId },
        order: { createdAt: 'DESC' },
      });

      if (!latestPost) {
        console.log('No post found for user, skipping notification');
        return;
      }

      // Get first 50 characters of content as preview
      const contentPreview = latestPost.content?.substring(0, 50) || 'your post';
      const displayText = contentPreview.length < latestPost.content?.length 
        ? `${contentPreview}...` 
        : contentPreview;

      console.log('Creating notification with displayText:', displayText);

      await this.notificationsService.createSystemNotification(
        payload.userId,
        'Post Published Successfully',
        `Your post "${displayText}" has been published and is now live!`,
        NotificationType.POST_POST_NOW,
        `/posts/${latestPost.id}`,
        { postId: latestPost.id },
      );
      
      console.log('Notification created successfully');
    } catch (error) {
      console.error('Failed to create post notification:', error.message);
      console.error('Full error:', error);
    }
  }

  @OnEvent('post.updated')
  async handlePostUpdated(payload: { userId: string }) {
    try {
      if (!payload.userId) {
        return;
      }

      // Query latest post by this user
      const latestPost = await this.postRepository.findOne({
        where: { user_id: payload.userId },
        order: { createdAt: 'DESC' },
      });

      if (!latestPost) {
        console.log('No post found for user, skipping notification');
        return;
      }

      const contentPreview = latestPost.content?.substring(0, 50) || 'your post';
      const displayText = contentPreview.length < latestPost.content?.length 
        ? `${contentPreview}...` 
        : contentPreview;

      await this.notificationsService.createSystemNotification(
        payload.userId,
        'Post Updated Successfully',
        `Your post "${displayText}" has been updated and published!`,
        NotificationType.POST_POST_NOW,
        `/posts/${latestPost.id}`,
        { postId: latestPost.id },
      );
    } catch (error) {
      console.error('Failed to create post update notification:', error.message);
    }
  }

  @OnEvent('social.connected')
  async handleSocialConnected(payload: { userId: string; platform: string; pageName: string }) {
    try {
      await this.notificationsService.createSystemNotification(
        payload.userId,
        'Social Account Connected',
        `Your ${payload.platform} page "${payload.pageName}" has been connected successfully!`,
        NotificationType.SOCIAL_CONNECTED,
        '/social-accounts',
        { platform: payload.platform, pageName: payload.pageName },
      );
    } catch (error) {
      console.error('Failed to create social connection notification:', error.message);
    }
  }

  @OnEvent('user.created')
  async handleUserCreated(payload: { userId: string; firstName?: string; email: string }) {
    try {
      if (!payload.userId) {
        return;
      }

      const displayName = payload.firstName || 'User';
      
      await this.notificationsService.createSystemNotification(
        payload.userId,
        'Welcome to the system!',
        `Hello ${displayName}! Welcome to the AISAM system. Explore the amazing features we offer!`,
        NotificationType.USER_WELCOME,
        '/dashboard',
        { 
          firstName: payload.firstName,
          email: payload.email,
          welcomeDate: new Date().toISOString()
        },
      );
    } catch (error) {
      console.error('Failed to create welcome notification:', error.message);
    }
  }
}