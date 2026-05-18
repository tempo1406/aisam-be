import { Module } from '@nestjs/common';
import { PolicyController } from './policy.controller';

@Module({
  imports: [],
  controllers: [PolicyController],
  providers: [],
  exports: [],
})
export class PolicyModule {}
