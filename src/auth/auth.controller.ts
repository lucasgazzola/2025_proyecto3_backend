import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register.dto';
import { LoginAuthDto } from './dto/login.dto';
import { JwtAuthGuard } from './auth-roles.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiBody({ type: RegisterAuthDto })
  async register(@Body() dto: RegisterAuthDto) {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login and receive access and refresh tokens' })
  @ApiResponse({
    status: 200,
    description: 'Returns accessToken, refreshToken and user',
  })
  @ApiBody({ type: LoginAuthDto })
  async login(@Body() dto: LoginAuthDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  logout() {
    return this.authService.logout();
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'New accessToken and refreshToken' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.sendPasswordResetEmail(email);
  }

  @Post('validate-token')
  @ApiOperation({ summary: 'Validate a token (auth/refresh/reset)' })
  @ApiResponse({ status: 200, description: 'Returns whether token is valid' })
  async validateToken(@Body('token') token: string) {
    return this.authService.validateToken(token);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify token and return payload' })
  @ApiResponse({ status: 200, description: 'Verification result and payload' })
  async verify(@Body('token') token: string, @Headers() headers: any) {
    const authHeader = headers?.authorization || '';
    const parts = authHeader.split(' ');
    const bearerToken =
      parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
    const tokenToCheck = token || bearerToken;
    return this.authService.validateToken(tokenToCheck, 'auth');
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Get the current user from token' })
  @ApiResponse({
    status: 200,
    description: 'Returns the token payload as user',
  })
  me(@Req() req: any) {
    return { user: req.user };
  }
}
