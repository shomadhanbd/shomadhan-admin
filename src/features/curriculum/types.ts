export interface EducationLevel {
  id: number;
  name: string;
  slug: string;
  group_count: number;
  subject_count: number;
  chapter_count: number;
  block_count: number;
  question_count: number;
}

export interface EducationLevelBody {
  name: string;
  slug: string;
}

export interface AcademicGroup {
  id: number;
  name: string;
  slug: string;
  education_level: number;
  education_level_name: string;
  subject_count: number;
  chapter_count: number;
  block_count: number;
  question_count: number;
}

export interface AcademicGroupBody {
  name: string;
  slug: string;
  education_level: number;
}

export interface Batch {
  id: number;
  name: string;
  slug: string;
  education_level: number;
  education_level_name: string;
  is_active: boolean;
}

export interface BatchBody {
  name: string;
  slug: string;
  education_level: number;
  is_active: boolean;
}

export interface Subject {
  id: number;
  name: string;
  slug: string;
  education_level: number;
  education_level_name: string;
  academic_group: number;
  academic_group_name: string;
  chapter_count: number;
  block_count: number;
  question_count: number;
}

export interface SubjectBody {
  name: string;
  slug: string;
  education_level: number;
  academic_group: number;
}

export interface Chapter {
  id: number;
  name: string;
  slug: string;
  subject: number;
  subject_name: string;
  chapter_number: number;
  is_locked: boolean;
  block_count: number;
  question_count: number;
}

export interface ChapterBody {
  name: string;
  slug: string;
  subject: number;
  chapter_number: number;
  is_locked: boolean;
}

export interface Topic {
  id: number;
  name: string;
  slug: string;
  chapter: number;
  chapter_name: string;
}

export interface TopicBody {
  name: string;
  slug: string;
  chapter: number;
}
