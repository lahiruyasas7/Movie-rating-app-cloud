import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
//sample change to check cicd flow working
//sample chnage 2 to check cicd flow working
//sample change 3 to check cicd flow working
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
