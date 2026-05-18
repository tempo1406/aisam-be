import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '@decorators/auth/public.decorator';
import { GoogleGuard } from '@guards/google-guard/google-guard.guard';
import { ConfigService } from '@nestjs/config';
import { LocalAuthGuard } from '@guards/local-guard/local-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { LoginDto } from './dto/login.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiOperationAuto } from '@decorators/swagger/api-operation.decorator';
import { RefreshJwtDto } from './types/refresh-jwt.type';
import { RefreshTokenGuard } from '@guards/jwt-guard/refresh-jwt.guard';
import { CreateOtpDto } from './dto/create-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GetUser } from '@decorators/auth/get-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RoleEnum } from 'src/enums/role.enum';
import { FacebookGuard } from '@guards/facebook-guard/facebook-guard.guard';
import { FacebookService } from '@modules/socials-connect/facebook/facebook.service';
import { SocialAccountService } from '@modules/social/social-account.service';
import { ConnectFacebookPageDto } from '@modules/social/dto/create-connect-social.dto';
import { InstagramService } from '@modules/socials-connect/instagram/instagram.service';

@ApiBearerAuth('Authorization')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly facebookService: FacebookService,
    private readonly socialAccountService: SocialAccountService,
    private readonly instagramService: InstagramService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperationAuto('Register for user', 'Create a account for this product')
  async register(@Body() payload: RegisterDto) {
    await this.authService.register(payload);
    return new ApiResponseDto(201, 'Register Successfully!');
  }

  @Public()
  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiOperationAuto('Login for user', 'Authenticate user and return JWT token')
  @UseGuards(LocalAuthGuard)
  async login(@Req() req: any) {
    const userId = req.user.id as string;
    const role = req.user.role.name as RoleEnum;
    const response = await this.authService.login(userId, role);
    return new ApiResponseDto(200, 'Login Successfully!', response);
  }

  @Public()
  @Get('google/login')
  @ApiOperationAuto('Login with Google', 'Authenticate user with Google')
  @UseGuards(GoogleGuard)
  googleLogin() {}

  @Public()
  @Get('google/callback')
  @ApiOperationAuto(
    'Google callback',
    'Callback from Google, rendirect to client',
  )
  @UseGuards(GoogleGuard)
  async googleCallback(@Req() req: any, @Res() res: any) {
    const userId = req.user.id as string;
    const role = (req.user.role as RoleEnum) || RoleEnum.USER;
    const response = await this.authService.login(userId, role);
    const redirectUrl = `${this.configService.get('FRONTEND_DOMAIN')}/login?accessToken=${response.accessToken}&refreshToken=${response.refreshToken}`;
    res.redirect(redirectUrl);
  }

  @Public()
  @Get('facebook/auth')
  @UseGuards(FacebookGuard)
  @ApiOperation({
    summary: 'Initiate Facebook OAuth',
    description:
      'Redirect user to Facebook login. Pass userId as query parameter: /auth/facebook/auth?userId=xxx',
  })
  @ApiQuery({ name: 'userId', type: String })
  facebookAuth(@Param('userId', ParseUUIDPipe) userId: string) {
    console.log('userId12312312', userId);
  }

  @Public()
  @Get('facebook/callback')
  @ApiOperationAuto(
    'Facebook callback',
    'Callback from Facebook, rendirect to client',
  )
  @UseGuards(FacebookGuard)
  @ApiOperation({
    summary: 'Facebook OAuth callback',
    description: 'Handle callback from Facebook after user grants permissions',
  })
  async facebookCallback(@Req() req: any, @Res() res: any) {
    let redirectUrl = '';
    try {
      const facebookUser = req.user;
      const accessToken = facebookUser.accessToken as string;

      const userId = facebookUser.userId as string;

      if (!userId) {
        console.error('Missing userId in callback');
        redirectUrl = `${this.configService.get(
          'FRONTEND_DOMAIN',
        )}/dashboard/social?socialStatus=false?error=missing_user_id`;
        res.redirect(redirectUrl);
        return;
      }

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error('Invalid UUID format:', userId);
        redirectUrl = `${this.configService.get('FRONTEND_DOMAIN')}/dashboard/social?socialStatus=false&error=invalid_user_id`;
        res.redirect(redirectUrl);
        return;
      }

      // Exchange for long-lived token
      const longLivedToken =
        await this.facebookService.exchangeToken(accessToken);

      // Get all pages
      const pages = await this.facebookService.getUserPages(
        longLivedToken.access_token,
      );

      if (!pages || pages.length === 0) {
        redirectUrl = `${this.configService.get(
          'FRONTEND_DOMAIN',
        )}/dashboard/social?socialStatus=false&error=no_pages`;
        res.redirect(redirectUrl);
        return;
      }

      // Get page info and Instagram accounts
      const pagesToConnect: ConnectFacebookPageDto[] = [];

      for (const page of pages) {
        console.log('page12312312', page);
        const pageInfo = await this.facebookService.getPageInfo({
          page_id: page.id,
          access_token: page.access_token,
        });

        const instagramAccount =
          await this.instagramService.getInstagramAccount(
            page.id,
            page.access_token,
          );

        pagesToConnect.push({
          pageId: page.id,
          pageName: pageInfo.name,
          pageAccessToken: page.access_token,
          pageImageUrl: pageInfo.page_image_url,
          fanCount: pageInfo.fan_count,
          followersCount: pageInfo.followers_count,
          instagramAccountId: instagramAccount?.id,
          instagramUsername: instagramAccount?.username,
          instagramName: instagramAccount?.name,
          instagramProfilePictureUrl: instagramAccount?.profile_picture_url,
          instagramFollowersCount: instagramAccount?.followers_count,
          instagramFollowsCount: instagramAccount?.follows_count,
          instagramMediaCount: instagramAccount?.media_count,
        });
      }

      // Save  to database
      await this.socialAccountService.connectFacebookPages(
        userId,
        pagesToConnect,
      );

      redirectUrl = `${this.configService.get('FRONTEND_DOMAIN')}/dashboard/social?socialStatus=true&pages=${pages.length}`;
      res.redirect(redirectUrl);
      return;
    } catch (error) {
      console.error('Error in Facebook callback:', error);
      redirectUrl = `${this.configService.get('FRONTEND_DOMAIN')}/dashboard/social?socialStatus=false`;
      res.redirect(redirectUrl);
      return;
    }
  }

  @Post('refresh-token')
  @ApiOperationAuto('Refresh token', 'Refresh token')
  @ApiBody({ type: RefreshJwtDto })
  @UseGuards(RefreshTokenGuard)
  async refreshToken(@Req() req: any) {
    const userId = req.user.sub as string;
    const refreshToken = req.body.refreshToken as string;
    const response = await this.authService.refreshToken(userId, refreshToken);
    return new ApiResponseDto(200, 'Refresh token successfully!', response);
  }

  @Public()
  @Post('create-otp')
  @ApiOperationAuto(
    'Create OTP',
    'Generate and send OTP to email for verification',
  )
  @ApiBody({ type: CreateOtpDto })
  async createOtp(@Body() createOtpDto: CreateOtpDto) {
    const response = await this.authService.createOtp(createOtpDto);
    return new ApiResponseDto(200, response.message);
  }

  @Public()
  @Post('verify-otp')
  @ApiOperationAuto('Verify OTP', 'Verify OTP code sent to email')
  @ApiBody({ type: VerifyOtpDto })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const response = await this.authService.verifyOtp(verifyOtpDto);
    return new ApiResponseDto(200, response.message);
  }

  @Put('change-password')
  @ApiOperationAuto('Change Password', 'Change password for authenticated user')
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @GetUser('sub') userId: string,
  ) {
    const response = await this.authService.changePassword(
      userId,
      changePasswordDto,
    );
    return new ApiResponseDto(200, response.message);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperationAuto('Forgot Password', 'Reset password using verified OTP')
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const response = await this.authService.forgotPassword(forgotPasswordDto);
    return new ApiResponseDto(200, response.message);
  }
}
