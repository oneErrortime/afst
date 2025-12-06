/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_AddBookToCollectionDTO } from '../models/models_AddBookToCollectionDTO';
import type { models_Collection } from '../models/models_Collection';
import type { models_CreateCollectionDTO } from '../models/models_CreateCollectionDTO';
import type { models_SuccessResponseDTO } from '../models/models_SuccessResponseDTO';
import type { models_UpdateCollectionDTO } from '../models/models_UpdateCollectionDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CollectionsService {
    /**
     * Get user's collections
     * Retrieves all collections for the authenticated user.
     * @returns models_Collection OK
     * @throws ApiError
     */
    public static getCollections(): CancelablePromise<Array<models_Collection>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/collections',
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create a new collection
     * Creates a new collection for the authenticated user.
     * @param collection Collection data
     * @returns models_Collection Created
     * @throws ApiError
     */
    public static postCollections(
        collection: models_CreateCollectionDTO,
    ): CancelablePromise<models_Collection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/collections',
            body: collection,
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get a collection by ID
     * Retrieves a single collection by its ID.
     * @param id Collection ID
     * @returns models_Collection OK
     * @throws ApiError
     */
    public static getCollections1(
        id: string,
    ): CancelablePromise<models_Collection> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/collections/{id}',
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
     * Update a collection
     * Updates a collection's name and/or description.
     * @param id Collection ID
     * @param collection Collection data to update
     * @returns models_Collection OK
     * @throws ApiError
     */
    public static putCollections(
        id: string,
        collection: models_UpdateCollectionDTO,
    ): CancelablePromise<models_Collection> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/collections/{id}',
            path: {
                'id': id,
            },
            body: collection,
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a collection
     * Deletes a collection by its ID.
     * @param id Collection ID
     * @returns models_SuccessResponseDTO OK
     * @throws ApiError
     */
    public static deleteCollections(
        id: string,
    ): CancelablePromise<models_SuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/collections/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Add a book to a collection
     * Adds a specific book to a specific collection.
     * @param id Collection ID
     * @param book Book ID to add
     * @returns models_SuccessResponseDTO OK
     * @throws ApiError
     */
    public static postCollectionsBooks(
        id: string,
        book: models_AddBookToCollectionDTO,
    ): CancelablePromise<models_SuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/collections/{id}/books',
            path: {
                'id': id,
            },
            body: book,
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Remove a book from a collection
     * Removes a specific book from a specific collection.
     * @param id Collection ID
     * @param bookId Book ID
     * @returns models_SuccessResponseDTO OK
     * @throws ApiError
     */
    public static deleteCollectionsBooks(
        id: string,
        bookId: string,
    ): CancelablePromise<models_SuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/collections/{id}/books/{book_id}',
            path: {
                'id': id,
                'book_id': bookId,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
