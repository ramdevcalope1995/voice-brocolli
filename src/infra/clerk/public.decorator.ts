import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Skip Clerk JWT check when CLERK_AUTH_ENABLED is true. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
