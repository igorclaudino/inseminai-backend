import { Controller, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Create new account' })
  @ApiResponse({ status: 201, description: 'User created — returns token, user and farmId' })
  @ApiResponse({ status: 409, description: 'E-mail already registered' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate and get JWT token' })
  @ApiResponse({ status: 200, description: 'Returns token, user, farmId and mustChangePassword flag' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset link',
    description: 'Sends a reset link to the e-mail if it is registered. Always returns the same response to avoid e-mail enumeration.',
  })
  @ApiResponse({ status: 201, description: 'Reset e-mail sent (or silently ignored if not found)' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password using token from e-mail',
    description: 'Validates the token (1 hour expiry) and sets the new password. Token is invalidated after use.',
  })
  @ApiResponse({ status: 201, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Change password',
    description:
      'Changes the user password. When called after the first login (mustChangePassword=true), ' +
      'automatically creates the farm and returns farmId.',
  })
  @ApiResponse({ status: 200, description: 'Password changed — returns new token, user and farmId' })
  @ApiResponse({ status: 400, description: 'Incorrect current password or password too short' })
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: any) {
    return this.authService.changePassword(user.sub, dto);
  }
}
