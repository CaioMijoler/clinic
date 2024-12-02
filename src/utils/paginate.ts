export interface IPaginate<T> {
  pagination?: {
    total: number;
    current_page: number;
    per_page: number;
  };
  data: T[];
}

export interface FilterPagination {
  paginate?: boolean;
  current_page?: number;
  per_page?: number;
  fields?: string;
  sort?: string;
  relations?: string;
}
