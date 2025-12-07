/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_BookFile } from './models_BookFile';
import type { models_BookStatus } from './models_BookStatus';
import type { models_Category } from './models_Category';
export type models_Book = {
    author: string;
    categories?: Array<models_Category>;
    copies_count?: number;
    cover_url?: string;
    created_at?: string;
    description?: string;
    download_count?: number;
    files?: Array<models_BookFile>;
    id?: string;
    is_premium?: boolean;
    isbn?: string;
    language?: string;
    page_count?: number;
    publication_year?: number;
    publisher?: string;
    rating?: number;
    rating_count?: number;
    status?: models_BookStatus;
    title: string;
    updated_at?: string;
    view_count?: number;
};

