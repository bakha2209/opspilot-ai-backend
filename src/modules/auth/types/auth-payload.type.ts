import { UserRole } from '../../../common/enums/user-role.enum';

export type AuthPayload = {
  sub: string;
  email: string;
  role: UserRole;
  companyId?: string | null;
};