import { RoleEnum, TypeEnum } from '@prisma/client';

export interface User {
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  nationalId: string;
  country: string;
  taxId: string;
  age: number;
  role: RoleEnum;
  type: TypeEnum;
  active: boolean;
  profileImage?: string | null;
  about?: string | null;
  registrationNumber?: string | null;
  industrial?: string | null;
  industrySector?: string | null;
  commercial?: string | null;
  address?: string | null;
  otpCode?: string | null;
  otpMethod?: string | null;
  otpExpiry?: Date | null;
  emailVerified: boolean;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}
