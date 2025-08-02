import { OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserForAdminDto extends OmitType(CreateUserDto, ['role', 'active'] as const) {}
