/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_CreateReviewDTO } from '../models/models_CreateReviewDTO';
import type { models_Review } from '../models/models_Review';
import type { models_SuccessResponseDTO } from '../models/models_SuccessResponseDTO';
import type { models_UpdateReviewDTO } from '../models/models_UpdateReviewDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReviewsService {
    /**
     * Create a new review
     * Adds a new review for a book by the authenticated user.
     * @param review Review data
     * @returns models_Review Created
     * @throws ApiError
     */
    public static postReviews(
        review: models_CreateReviewDTO,
    ): CancelablePromise<models_Review> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/reviews',
            body: review,
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get reviews for a book
     * Retrieves all reviews for a specific book.
     * @param bookId Book ID
     * @returns models_Review OK
     * @throws ApiError
     */
    public static getReviewsBook(
        bookId: string,
    ): CancelablePromise<Array<models_Review>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/reviews/book/{book_id}',
            path: {
                'book_id': bookId,
            },
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Update a review
     * Updates a review written by the authenticated user.
     * @param id Review ID
     * @param review Review data to update
     * @returns models_Review OK
     * @throws ApiError
     */
    public static putReviews(
        id: string,
        review: models_UpdateReviewDTO,
    ): CancelablePromise<models_Review> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/reviews/{id}',
            path: {
                'id': id,
            },
            body: review,
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a review
     * Deletes a review by its ID. Can be done by the author or an admin.
     * @param id Review ID
     * @returns models_SuccessResponseDTO OK
     * @throws ApiError
     */
    public static deleteReviews(
        id: string,
    ): CancelablePromise<models_SuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/reviews/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
