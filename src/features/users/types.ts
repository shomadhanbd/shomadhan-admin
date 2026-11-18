/** A student (or staff) account as the admin list returns it. */
export interface User {
  id: number;
  mobile: string | null;
  email: string | null;
  full_name: string;
  first_name: string;
  last_name: string;
  education_level: number | null;
  education_level_name: string | null;
  academic_group: number | null;
  academic_group_name: string | null;
  batch: number | null;
  batch_name: string | null;
  is_onboarded: boolean;
  is_active: boolean;
  is_staff: boolean;
  has_active_subscription: boolean;
  subscription_expires_at: string | null;
  date_joined: string;
  last_login: string | null;
}

export interface UserProgress {
  questions_answered: number;
  correct: number;
  wrong: number;
  /** `null` until an auto-graded question has been answered. */
  accuracy: number | null;
  last_active: string | null;
  tests_taken: number;
  cq_submissions: number;
  reports_filed: number;
}

export interface UserAttempt {
  id: number;
  kind: "mock" | "practice" | "daily";
  title: string;
  status: "in_progress" | "submitted" | "expired" | "graded";
  total_score: string;
  correct_count: number;
  wrong_count: number;
  started_at: string;
  submitted_at: string | null;
}

export interface UserSubscription {
  id: number;
  product_title: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  source: "sslcommerz" | "apple" | "admin";
}

/** One account fetched on its own: the list fields plus progress, streak, recent tests and subscriptions. */
export interface UserDetail extends User {
  progress: UserProgress;
  streak: { current: number; longest: number; last_active_date: string | null };
  recent_attempts: UserAttempt[];
  subscriptions: UserSubscription[];
}

/** The fields the admin can change. */
export interface UserBody {
  first_name: string;
  last_name: string;
  email: string | null;
  education_level: number | null;
  academic_group: number | null;
  batch: number | null;
  is_active: boolean;
}
