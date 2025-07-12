import { SetMetadata } from '@nestjs/common';

export const AdminRoles = (...roles: string[]) => SetMetadata('admin-roles', roles);