/** The shape every paginated `/admin/...` list answers with (Django REST Framework page-number pagination). */
export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Query-string params; empty values are dropped before the request. */
export type Params = Record<string, string | number | boolean | undefined>;

/** The signed-in admin, as `/auth/login/` and `/users/me/` return it. */
export interface AuthUser {
  id: number;
  mobile: string | null;
  email: string | null;
  full_name: string;
  first_name: string;
  last_name: string;
  /** Only an account with this set may use the panel. */
  is_staff?: boolean;
}
