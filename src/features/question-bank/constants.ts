import type { QuestionType } from "./types";

export const QUESTION_TYPES: { id: QuestionType; name: string }[] = [
  { id: "mcq", name: "MCQ" },
  { id: "cq", name: "Creative (CQ)" },
  { id: "fib", name: "Fill in the blanks" },
  { id: "ordering", name: "Ordering" },
  { id: "short_answer", name: "Short answer" },
  { id: "long_answer", name: "Long answer" },
  { id: "flow_chart", name: "Flow chart" },
  { id: "transformation", name: "Transformation" },
];

export const QUESTION_TYPE_LABELS = Object.fromEntries(QUESTION_TYPES.map((t) => [t.id, t.name])) as Record<
  QuestionType,
  string
>;

/** What kind of stimulus a group opens with; a rendering hint for the app, not content. */
export const STIMULUS_TYPES = [
  { id: "text", name: "Text" },
  { id: "image", name: "Image" },
  { id: "table", name: "Table" },
  { id: "diagram", name: "Diagram" },
  { id: "code", name: "Code" },
  { id: "composite", name: "Composite" },
];

/** Types whose `metadata` carries structure the panel has no form for yet, so it is edited as JSON. */
export const JSON_METADATA_TYPES: QuestionType[] = ["fib", "long_answer", "flow_chart", "transformation"];

/** Labels for the parts of a creative question. */
export const PART_LABELS = ["a", "b", "c", "d", "e", "f"];
