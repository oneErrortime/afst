/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_Category } from './models_Category';
import type { models_UserGroupType } from './models_UserGroupType';
export type models_UserGroup = {
    allowed_categories?: Array<models_Category>;
    can_download?: boolean;
    color?: string;
    created_at?: string;
    description?: string;
    id?: string;
    is_active?: boolean;
    loan_days?: number;
    max_books?: number;
    name: string;
    type: models_UserGroupType;
    updated_at?: string;
};

