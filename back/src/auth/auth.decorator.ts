import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

export const IS_PRIVATE_KEY = 'isPrivate';
export const IS_ADMIN_KEY = 'isAdmin';

export const Private = () => {
  return applyDecorators(
    SetMetadata(IS_PRIVATE_KEY, true),
    ApiBearerAuth(),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
};

export const Admin = () => {
  return applyDecorators(
    SetMetadata(IS_PRIVATE_KEY, true),
    SetMetadata(IS_ADMIN_KEY, true),
    ApiBearerAuth(),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  );
};
