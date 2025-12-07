/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { models_AuthRequestDTO } from '../models/models_AuthRequestDTO';
import type { models_AuthResponseDTO } from '../models/models_AuthResponseDTO';
import type { models_UserResponseDTO } from '../models/models_UserResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Log in a user
     * Logs in a user with the provided email and password, returning a JWT token.
     * @param authRequest User login data
     * @returns models_AuthResponseDTO OK
     * @throws ApiError
     */
    public static postAuthLogin(
        authRequest: models_AuthRequestDTO,
    ): CancelablePromise<models_AuthResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/login',
            body: authRequest,
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Get current user's profile
     * Retrieves the profile information for the currently authenticated user.
     * @returns models_UserResponseDTO OK
     * @throws ApiError
     */
    public static getAuthMe(): CancelablePromise<models_UserResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/me',
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Register a new user
     * Registers a new user with the provided email and password.
     * @param authRequest User registration data
     * @returns models_AuthResponseDTO Created
     * @throws ApiError
     */
    public static postAuthRegister(
        authRequest: models_AuthRequestDTO,
    ): CancelablePromise<models_AuthResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/register',
            body: authRequest,
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
}
