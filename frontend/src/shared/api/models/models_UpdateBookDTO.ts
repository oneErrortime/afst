/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_BookStatus } from './models_BookStatus';
export type models_UpdateBookDTO = {
    author?: string;
    category_ids?: Array<string>;
    copies_count?: number;
    cover_url?: string;
    description?: string;
    is_premium?: boolean;
    isbn?: string;
    language?: string;
    page_count?: number;
    publication_year?: number;
    publisher?: string;
    status?: models_BookStatus;
    title?: string;
};

