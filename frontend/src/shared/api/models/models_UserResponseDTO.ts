/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_Subscription } from './models_Subscription';
import type { models_UserGroup } from './models_UserGroup';
import type { models_UserRole } from './models_UserRole';
export type models_UserResponseDTO = {
    avatar_url?: string;
    created_at?: string;
    email?: string;
    email_verified?: boolean;
    group?: models_UserGroup;
    group_id?: string;
    id?: string;
    is_active?: boolean;
    name?: string;
    role?: models_UserRole;
    subscription?: models_Subscription;
};
