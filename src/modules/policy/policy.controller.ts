import { Public } from '@decorators/auth/public.decorator';
import { Controller, Get, Res } from '@nestjs/common';
import { join } from 'path';

@Controller({ path: 'policy', version: '1' })
export class PolicyController {
  @Public()
  @Get('facebook-policy')
  getPrivacyPolicy(@Res() res: any): any {
    const filePath = join(
      process.cwd(),
      'src/modules/policy/html/facebook-policy.html',
    );
    return res.sendFile(filePath);
  }
}
