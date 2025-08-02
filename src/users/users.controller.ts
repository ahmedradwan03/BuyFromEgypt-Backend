import { Controller, Get, Post, Body, Put, UseGuards, Req, Param, Delete, Patch, HttpStatus, ForbiddenException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleEnum, User } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CommentLikesService } from 'src/comment-likes/comment-likes.service';
import { ProfileResponse } from './interfaces/profile.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from '../auth/interfaces/auth-request.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserForAdminDto } from './dto/update-userForAdmin.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly commentLikesService: CommentLikesService
  ) {}

  @Get('admin')
  @Roles(`${RoleEnum.ADMIN}`)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiResponse({ status: HttpStatus.ACCEPTED, description: 'Get all users' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found any Users' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiResponse({ status: HttpStatus.OK, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async getUserProfile(@Req() req: AuthenticatedRequest): Promise<ProfileResponse> {
    return this.usersService.getUserProfile(req.user.userId);
  }

  @Put('profile')
  @UseGuards(AuthGuard)
  @Roles(`${RoleEnum.ADMIN}`, `${RoleEnum.USER}`)
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Please Login and try again' })
  async updateUser(@Req() req: AuthenticatedRequest, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(req.user.userId, updateUserDto);
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile updated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email or phone number already taken' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not authorized to update this profile' })
  async updateProfile(@Req() req: AuthenticatedRequest, @Body() updateProfileDto: UpdateProfileDto, @UploadedFile() profileImage?: Express.Multer.File) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto, profileImage);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiResponse({ status: HttpStatus.OK, description: 'User retrieved successfully By Admin' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This is allowed only for admin' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Please login and try again' })
  async getUserById(@Param('id') userId: string) {
    return this.usersService.getUser(userId);
  }

  @ApiBody({ type: CreateUserDto })
  @Roles(`${RoleEnum.ADMIN}`)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This allow only for admin' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error' })
  @Post('admin')
  create(@Body() createUserDto: CreateUserDto) {
    console.log(createUserDto);
    return this.usersService.createUser(createUserDto);
  }

  @Put('admin/:id')
  @Roles(`${RoleEnum.ADMIN}`)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBody({ type: UpdateUserForAdminDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully By Admin' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This allow only for admin' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Please Login and try again' })
  async updateUserForAdmin(@Param('id') userId: string, @Body() updateUserForAdminDto: UpdateUserForAdminDto) {
    return this.usersService.updateUser(userId, updateUserForAdminDto);
  }

  @Put('admin/approveUser/:id')
  @Roles(RoleEnum.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiResponse({ status: HttpStatus.OK, description: 'User approved successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This allow only for admin' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User already activated' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Please Login and try again' })
  async approveUser(@Param('id') userId: string) {
    return this.usersService.toggleUserState(userId, 'approve');
  }

  @Put('admin/deactivateUser/:id')
  @Roles(RoleEnum.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiResponse({ status: HttpStatus.OK, description: 'User deactivated successfully' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This allow only for admin' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User already deactivated' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Please Login and try again' })
  async deactivateUser(@Param('id') userId: string) {
    return this.usersService.toggleUserState(userId, 'deactivate');
  }

  @Delete('admin/:id')
  @Roles(`${RoleEnum.ADMIN}`)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiResponse({ status: HttpStatus.OK, description: 'User deleted successfully By Admin' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This allow only for admin' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User with this ID not found' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Please Login and try again' })
  async delete(@Param('id') userId: string) {
    return this.usersService.deleteUser(userId);
  }

  @Get(':id/summary')
  async getUserSummary(@Param('id') userId: string) {
    return this.usersService.getUserSummary(userId);
  }
}
