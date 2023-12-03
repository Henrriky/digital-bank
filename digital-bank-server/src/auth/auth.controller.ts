import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDTO } from './dto/signin-dto';
import { AuthGuard } from './auth.guard';
import { RefreshTokenDTO } from './dto/refresh-token-dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDTO: SignInDTO) {
    return await this.authService.signIn({
      email: signInDTO.email,
      password: signInDTO.password,
    });
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return await this.authService.getProfile(req.client.sub);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(@Body() { refresh_token }: RefreshTokenDTO) {
    return await this.authService.refreshToken(refresh_token);
  }
}
