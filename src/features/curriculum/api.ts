import api from "@/lib/api";
import type {
  AcademicGroupBody,
  BatchBody,
  Chapter,
  ChapterBody,
  EducationLevelBody,
  SubjectBody,
  Topic,
  TopicBody,
} from "./types";
import type { Page } from "@/types/api";

/** `/admin/education-levels/`: the exam stage a student prepares for, e.g. "HSC". */
export const EDUCATION_LEVELS = "/admin/education-levels/";
/** `/admin/academic-groups/`: a stream within one level, e.g. "Science". */
export const ACADEMIC_GROUPS = "/admin/academic-groups/";
/** `/admin/batches/`: a cohort of one level, e.g. "HSC 2026". */
export const BATCHES = "/admin/batches/";
/** `/admin/subjects/`: a subject of one level and group. */
export const SUBJECTS = "/admin/subjects/";
/** `/admin/chapters/`: a chapter of one subject. */
export const CHAPTERS = "/admin/chapters/";
/** `/admin/topics/`: a topic of one chapter. */
export const TOPICS = "/admin/topics/";

/** `all` is each list's cache prefix; `lookup` is its dropdown cache in `lib/lookups.ts`, where it has one. */
export const curriculumKeys = {
  educationLevels: { all: ["education-levels"] as const, lookup: ["lookup", "education-levels"] as const },
  academicGroups: { all: ["academic-groups"] as const, lookup: ["lookup", "academic-groups"] as const },
  batches: { all: ["batches"] as const, lookup: ["lookup", "batches"] as const },
  subjects: { all: ["subjects"] as const, lookup: ["lookup", "subjects"] as const },
  chapters: { all: ["chapters"] as const, lookup: ["lookup", "chapters"] as const },
  topics: { all: ["topics"] as const },
};

/** Create and update for one collection; lists and deletes go through `useCrudList`. */
const writes = <Body>(path: string) => ({
  create: async (body: Body) => (await api.post(path, body)).data,
  update: async (id: number, body: Partial<Body>) => (await api.patch(`${path}${id}/`, body)).data,
});

export const educationLevelsApi = writes<EducationLevelBody>(EDUCATION_LEVELS);
export const academicGroupsApi = writes<AcademicGroupBody>(ACADEMIC_GROUPS);
export const batchesApi = writes<BatchBody>(BATCHES);
export const subjectsApi = writes<SubjectBody>(SUBJECTS);
export const topicsApi = {
  ...writes<TopicBody>(TOPICS),
  /** Every topic of one chapter, for the question editor's topic picker. */
  byChapter: async (chapter: number) =>
    (await api.get<Page<Topic>>(TOPICS, { params: { chapter, page_size: 200 } })).data.results,
};
export const chaptersApi = {
  ...writes<ChapterBody>(CHAPTERS),
  /** Every chapter of one subject, for the topic form's chapter picker. */
  bySubject: async (subject: number) =>
    (await api.get<Page<Chapter>>(CHAPTERS, { params: { subject, page_size: 200 } })).data.results,
};
