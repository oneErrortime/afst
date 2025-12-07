/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_SuccessResponseDTO } from '../models/models_SuccessResponseDTO';
import type { models_UserPublicProfileDTO } from '../models/models_UserPublicProfileDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SocialService {
    /**
     * Follow a user
     * Subscribes the authenticated user to another user.
     * @param id User ID to follow
     * @returns models_SuccessResponseDTO OK
     * @throws ApiError
     */
    public static postUsersFollow(
        id: string,
    ): CancelablePromise<models_SuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/{id}/follow',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Unfollow a user
     * Unsubscribes the authenticated user from another user.
     * @param id User ID to unfollow
     * @returns models_SuccessResponseDTO OK
     * @throws ApiError
     */
    public static deleteUsersFollow(
        id: string,
    ): CancelablePromise<models_SuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/users/{id}/follow',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get a user's public profile
     * Retrieves a user's public profile including follower counts, collections, and reviews.
     * @param id User ID
     * @returns models_UserPublicProfileDTO OK
     * @throws ApiError
     */
    public static getUsersProfile(
        id: string,
    ): CancelablePromise<models_UserPublicProfileDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/{id}/profile',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
}
