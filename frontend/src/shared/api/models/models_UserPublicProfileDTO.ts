/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_Collection } from './models_Collection';
import type { models_Review } from './models_Review';
export type models_UserPublicProfileDTO = {
    collections?: Array<models_Collection>;
    follower_count?: number;
    following_count?: number;
    id?: string;
    name?: string;
    reviews?: Array<models_Review>;
};
