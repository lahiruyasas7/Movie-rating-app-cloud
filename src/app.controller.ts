import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
//sample change to check cicd flow working
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
