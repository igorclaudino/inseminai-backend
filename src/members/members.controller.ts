import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/farm-id.decorator';
import { RequireAdmin } from '../common/decorators/require-admin.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, FarmGuard)
@RequireAdmin()
@ApiBearerAuth('JWT')
@ApiTags('Farm Members')
@Controller('members')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'List farm members (admin only)' })
  listMembers(@FarmId() farmId: string) {
    return this.membersService.listMembers(farmId);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new member by email (admin only)' })
  @ApiResponse({ status: 201, description: 'Invitation sent' })
  @ApiResponse({ status: 409, description: 'Invitation already exists or user is already a member' })
  inviteMember(
    @FarmId() farmId: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.membersService.inviteMember(farmId, dto, user.id);
  }

  @Get('invitations')
  @ApiOperation({ summary: 'List pending invitations (admin only)' })
  listPendingInvitations(@FarmId() farmId: string) {
    return this.membersService.listPendingInvitations(farmId);
  }

  @Delete('invitations/:invitationId')
  @ApiOperation({ summary: 'Cancel a pending invitation (admin only)' })
  cancelInvitation(
    @FarmId() farmId: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.membersService.cancelInvitation(farmId, invitationId);
  }

  @Patch(':memberId')
  @ApiOperation({ summary: 'Update a member role (admin only)' })
  updateMemberRole(
    @FarmId() farmId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: any,
  ) {
    return this.membersService.updateMemberRole(farmId, memberId, dto, user.id);
  }

  @Delete(':memberId')
  @ApiOperation({ summary: 'Remove a member from the farm (admin only)' })
  removeMember(
    @FarmId() farmId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.membersService.removeMember(farmId, memberId, user.id);
  }
}
