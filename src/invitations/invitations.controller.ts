import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Get invitation details (no authentication required)' })
  @ApiResponse({ status: 200, description: 'Invitation details' })
  @ApiResponse({ status: 404, description: 'Invalid invitation' })
  getInvitation(@Param('token') token: string) {
    return this.invitationsService.getInvitation(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Accept invitation (requires authentication with the correct email)' })
  @ApiResponse({ status: 201, description: 'Invitation accepted, member added to farm' })
  @ApiResponse({ status: 400, description: 'Expired invitation or incorrect email' })
  acceptInvitation(@Param('token') token: string, @CurrentUser() user: any) {
    return this.invitationsService.acceptInvitation(token, user.id);
  }
}
