import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  @Get('users')
  listUsers() {
    return this.authService.listUsers();
  }

  @Post('users')
  createUser(
    @Body()
    body: {
      fullName: string;
      username: string;
      password: string;
      role: 'ADMIN' | 'EMPLOYEE';
    },
  ) {
    return this.authService.createUser(body);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: Record<string, string | boolean>) {
    return this.authService.updateUser(id, body);
  }
}
