export interface CreateReaderDTO {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UpdateReaderDTO {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface BorrowRequestDTO {
  book_id: string;
  reader_id: string;
  due_date?: string;
}

export interface ReturnRequestDTO {
  borrow_id: string;
  returned_date?: string;
}

export interface CreateCategoryDTO {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: string;
}

export interface CreateGroupDTO {
  name: string;
  description?: string;
  type?: string;
}

export interface UpdateGroupDTO {
  name?: string;
  description?: string;
  type?: string;
}

export interface SubscribePlanDTO {
  plan: string;
}

export interface GrantAccessDTO {
  user_id: string;
  book_id: string;
  access_type?: string;
}

export interface UpdateProgressDTO {
  current_page?: number;
  progress_percent?: number;
}

export interface StartSessionDTO {
  book_id: string;
  start_page?: number;
}
