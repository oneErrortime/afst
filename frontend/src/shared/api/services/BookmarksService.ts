/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_Bookmark } from '../models/models_Bookmark';
import type { models_CreateBookmarkDTO } from '../models/models_CreateBookmarkDTO';
import type { models_SuccessResponseDTO } from '../models/models_SuccessResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BookmarksService {
    /**
     * Create a new bookmark
     * Adds a new bookmark for a book by the authenticated user.
     * @param bookmark Bookmark data
     * @returns models_Bookmark Created
     * @throws ApiError
     */
    public static postBookmarks(
        bookmark: models_CreateBookmarkDTO,
    ): CancelablePromise<models_Bookmark> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/bookmarks',
            body: bookmark,
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get bookmarks for a book
     * Retrieves all bookmarks for a specific book by the authenticated user.
     * @param bookId Book ID
     * @returns models_Bookmark OK
     * @throws ApiError
     */
    public static getBookmarksBook(
        bookId: string,
    ): CancelablePromise<Array<models_Bookmark>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/bookmarks/book/{book_id}',
            path: {
                'book_id': bookId,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a bookmark
     * Deletes a bookmark by its ID.
     * @param id Bookmark ID
     * @returns models_SuccessResponseDTO OK
     * @throws ApiError
     */
    public static deleteBookmarks(
        id: string,
    ): CancelablePromise<models_SuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/bookmarks/{id}',
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
