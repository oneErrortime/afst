/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { handlers_CreateAdminRequest } from '../models/handlers_CreateAdminRequest';
import type { models_ListResponseDTO } from '../models/models_ListResponseDTO';
import type { models_UpdateUserDTO } from '../models/models_UpdateUserDTO';
import type { models_UserResponseDTO } from '../models/models_UserResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * List users
     * Get a paginated list of users. Admin access required.
     * @param limit Limit per page
     * @param offset Offset for pagination
     * @returns any OK
     * @throws ApiError
     */
    public static getUsers(
        limit?: number,
        offset?: number,
    ): CancelablePromise<(models_ListResponseDTO & {
        Data?: Array<models_UserResponseDTO>;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users',
            query: {
                'limit': limit,
                'offset': offset,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create a new admin user
     * Creates a new user with the admin role. Admin access required.
     * @param adminRequest Admin user data
     * @returns models_UserResponseDTO Created
     * @throws ApiError
     */
    public static postUsersAdmin(
        adminRequest: handlers_CreateAdminRequest,
    ): CancelablePromise<models_UserResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/admin',
            body: adminRequest,
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * Update a user by ID
     * Update user details by their ID. Admin access required.
     * @param id User ID
     * @param user User data to update
     * @returns models_UserResponseDTO OK
     * @throws ApiError
     */
    public static putUsers(
        id: string,
        user: models_UpdateUserDTO,
    ): CancelablePromise<models_UserResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/users/{id}',
            path: {
                'id': id,
            },
            body: user,
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
}
