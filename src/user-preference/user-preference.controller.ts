import { Controller, Body, Post, Get, Req, UseGuards } from '@nestjs/common';
import { UserPreferenceService } from './user-preference.service';
import { UserPreferenceDto } from './dto/user-preference.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/auth-request.interface';

@Controller('user-preference')
export class UserPreferenceController {
  constructor(private readonly userPreferenceService: UserPreferenceService) {}

  @Post()
  async upsert(@Body() userPreferenceDto: UserPreferenceDto) {
    return this.userPreferenceService.upsertPreference(userPreferenceDto);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async getMine(@Req() req: AuthenticatedRequest) {
    return this.userPreferenceService.getMyPreference(req.user.userId);
  }
}
