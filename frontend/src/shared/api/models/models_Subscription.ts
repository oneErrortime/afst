/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { models_SubscriptionPlan } from './models_SubscriptionPlan';
import type { models_SubscriptionStatus } from './models_SubscriptionStatus';
import type { models_User } from './models_User';
export type models_Subscription = {
    auto_renew?: boolean;
    can_access_premium?: boolean;
    created_at?: string;
    currency?: string;
    end_date?: string;
    id?: string;
    max_books?: number;
    max_downloads?: number;
    notes?: string;
    payment_id?: string;
    plan?: models_SubscriptionPlan;
    price?: number;
    start_date?: string;
    status?: models_SubscriptionStatus;
    updated_at?: string;
    user?: models_User;
    user_id?: string;
};

