/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { models_Book } from '../models/models_Book';
import type { models_CreateBookDTO } from '../models/models_CreateBookDTO';
import type { models_SuccessResponseDTO } from '../models/models_SuccessResponseDTO';
import type { models_UpdateBookDTO } from '../models/models_UpdateBookDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BooksService {
    /**
     * Get all books
     * Retrieves a paginated list of all available books.
     * @param limit Number of books to return
     * @param offset Offset for pagination
     * @returns any OK
     * @throws ApiError
     */
    public static getBooks(
        limit: number = 20,
        offset?: number,
    ): CancelablePromise<(models_SuccessResponseDTO & {
        Data?: Array<models_Book>;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/books',
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
     * Create a new book
     * Adds a new book to the library. Librarian access required.
     * @param book Book creation data
     * @returns any Created
     * @throws ApiError
     */
    public static postBooks(
        book: models_CreateBookDTO,
    ): CancelablePromise<(models_SuccessResponseDTO & {
        Data?: models_Book;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/books',
            body: book,
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                409: `Conflict`,
            },
        });
    }
    /**
     * Get a book by ID
     * Retrieves the details of a specific book by its UUID.
     * @param id Book ID
     * @returns models_Book OK
     * @throws ApiError
     */
    public static getBooks1(
        id: string,
    ): CancelablePromise<models_Book> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/books/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Update a book
     * Updates the details of a specific book. Librarian access required.
     * @param id Book ID
     * @param book Book data to update
     * @returns any OK
     * @throws ApiError
     */
    public static putBooks(
        id: string,
        book: models_UpdateBookDTO,
    ): CancelablePromise<(models_SuccessResponseDTO & {
        Data?: models_Book;
    })> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/books/{id}',
            path: {
                'id': id,
            },
            body: book,
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Delete a book
     * Deletes a book from the library. Librarian access required.
     * @param id Book ID
     * @returns models_SuccessResponseDTO OK
     * @throws ApiError
     */
    public static deleteBooks(
        id: string,
    ): CancelablePromise<models_SuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/books/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Get book recommendations
     * Retrieves a list of recommended books based on the reading history of users who read the specified book.
     * @param id Book ID
     * @param limit Limit for recommendations
     * @returns any OK
     * @throws ApiError
     */
    public static getBooksRecommendations(
        id: string,
        limit: number = 10,
    ): CancelablePromise<(models_SuccessResponseDTO & {
        Data?: Array<models_Book>;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/books/{id}/recommendations',
            path: {
                'id': id,
            },
            query: {
                'limit': limit,
            },
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
}
