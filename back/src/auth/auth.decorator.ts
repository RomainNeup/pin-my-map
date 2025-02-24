import { applyDecorators, SetMetadata } from "@nestjs/common";
import { ApiBearerAuth, ApiResponse } from "@nestjs/swagger";

export const IS_PRIVATE_KEY = 'isPrivate';
export const Private = () => {
    return applyDecorators(
        SetMetadata(IS_PRIVATE_KEY, true),
        ApiBearerAuth(),
        ApiResponse({ status: 401, description: 'Unauthorized' }),
    );
};