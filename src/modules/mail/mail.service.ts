import { Injectable } from '@nestjs/common';
import { MailerService } from '@modules/mailer/mailer.service';
import * as dayjs from 'dayjs';
import { WelcomeMailDTO } from './dto/create-mailler.dto';
import * as path from 'path';

export interface OtpEmailDTO {
  email: string;
  otp: string;
  username: string;
  expiryTime: string;
}

export interface StatisticsEmailDTO {
  email: string;
  username: string;
  date: string;
  statistics: {
    page: string;
    posts: number;
    likes: number;
    comments: number;
    shares: number;
    engagement_rate: number;
  }[];
}

@Injectable()
export class MaillerService {
  constructor(private readonly mailerService: MailerService) {}

  sendMailWelcome(welcomeMailDto: WelcomeMailDTO): void {
    try {
      void this.mailerService.sendMail({
        to: welcomeMailDto.email,
        subject: `Welcome to BoilerDay, ${welcomeMailDto.username}!`,
        templatePath: path.join(
          process.cwd(),
          'src',
          'modules',
          'mail',
          'templates',
          'welcome.hbs',
        ),
        context: {
          username: welcomeMailDto.username,
          email: welcomeMailDto.email,
          url: 'https://boilerday.ai/start',
          dateTime: dayjs().format('HH:mm - DD/MM/YYYY'),
          year: dayjs().format('YYYY'),
        },
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  sendOtpEmail(otpEmailDto: OtpEmailDTO): void {
    try {
      void this.mailerService.sendMail({
        to: otpEmailDto.email,
        subject: 'Your OTP Code - AISAM',
        templatePath: path.join(
          process.cwd(),
          'src',
          'modules',
          'mail',
          'templates',
          'otp-email.hbs',
        ),
        context: {
          username: otpEmailDto.username,
          email: otpEmailDto.email,
          otp: otpEmailDto.otp,
          expiryTime: otpEmailDto.expiryTime,
          dateTime: dayjs().format('HH:mm - DD/MM/YYYY'),
          year: dayjs().format('YYYY'),
        },
      });
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw error;
    }
  }

  async sendStatisticsEmail(statisticsEmailDto: StatisticsEmailDTO): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: statisticsEmailDto.email,
        subject: `📊 Báo cáo thống kê ngày ${statisticsEmailDto.date} - AISAM`,
        templatePath: path.join(
          process.cwd(),
          'src',
          'modules',
          'mail',
          'templates',
          'statistics.hbs',
        ),
        context: {
          username: statisticsEmailDto.username,
          email: statisticsEmailDto.email,
          date: statisticsEmailDto.date,
          statistics: statisticsEmailDto.statistics,
          totalPosts: statisticsEmailDto.statistics.reduce((sum, s) => sum + s.posts, 0),
          totalLikes: statisticsEmailDto.statistics.reduce((sum, s) => sum + s.likes, 0),
          totalComments: statisticsEmailDto.statistics.reduce((sum, s) => sum + s.comments, 0),
          totalShares: statisticsEmailDto.statistics.reduce((sum, s) => sum + s.shares, 0),
          dateTime: dayjs().format('HH:mm - DD/MM/YYYY'),
          year: dayjs().format('YYYY'),
          url: process.env.FRONTEND_URL || 'https://aisam.ai',
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
