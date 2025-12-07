/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { models_Book } from './models_Book';
import type { models_FileType } from './models_FileType';
export type models_BookFile = {
    book?: models_Book;
    book_id?: string;
    created_at?: string;
    file_name?: string;
    file_size?: number;
    file_type?: models_FileType;
    id?: string;
    is_processed?: boolean;
    metadata?: string;
    mime_type?: string;
    original_name?: string;
    page_count?: number;
    updated_at?: string;
};

