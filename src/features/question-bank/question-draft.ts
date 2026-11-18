import { JSON_METADATA_TYPES, PART_LABELS } from "./constants";
import type { PreviewBlock } from "./components/block-preview";
import type { BlockKind, QuestionBlock, QuestionBlockBody, QuestionBody, QuestionType } from "./types";

/** The question editor's form state: one draft per block, holding a draft per question. */

export interface OptionDraft {
  id?: number;
  label: string;
  content: string;
  is_correct: boolean | null;
}

export interface QuestionDraft {
  /** Stable React key; a new question has no id to key on. */
  key: string;
  id?: number;
  question_type: QuestionType;
  label: string;
  marks: string;
  prompt_content: string;
  model_answer: string;
  explanation: string;
  /** MCQ only: whether more than one option may be correct. */
  selectMode: "single" | "multiple";
  /** The raw `metadata` as JSON text, for the types edited that way. */
  metadataText: string;
  options: OptionDraft[];
}

export interface BlockDraft {
  kind: BlockKind;
  subject: string;
  chapter: string;
  topics: number[];
  stimulus_type: string;
  stimulus_content: string;
  questions: QuestionDraft[];
}

let nextKey = 0;
const newKey = () => `q${nextKey++}`;

export const emptyOption = (): OptionDraft => ({ label: "", content: "", is_correct: false });

export function blankQuestion(type: QuestionType, label = ""): QuestionDraft {
  return {
    key: newKey(),
    question_type: type,
    label,
    marks: type === "mcq" ? "1" : "2",
    prompt_content: "",
    model_answer: "",
    explanation: "",
    selectMode: "single",
    metadataText: "{}",
    options: type === "mcq" ? [emptyOption(), emptyOption(), emptyOption(), emptyOption()] : [],
  };
}

/** A new block: one MCQ when standalone, the four parts of a creative question when a group. */
export function blankBlock(kind: BlockKind, subject = "", chapter = ""): BlockDraft {
  return {
    kind,
    subject,
    chapter,
    topics: [],
    stimulus_type: kind === "group" ? "text" : "",
    stimulus_content: "",
    questions:
      kind === "group" ? PART_LABELS.slice(0, 4).map((label) => blankQuestion("cq", label)) : [blankQuestion("mcq")],
  };
}

export function toDraft(block: QuestionBlock): BlockDraft {
  return {
    kind: block.kind,
    subject: String(block.subject),
    chapter: block.chapter ? String(block.chapter) : "",
    topics: block.topics,
    stimulus_type: block.stimulus_type,
    stimulus_content: block.stimulus_content,
    questions: block.questions.map((q) => ({
      key: newKey(),
      id: q.id,
      question_type: q.question_type,
      label: q.label,
      marks: q.marks,
      prompt_content: q.prompt_content,
      model_answer: q.model_answer,
      explanation: q.explanation,
      selectMode: q.metadata.select_mode === "multiple" ? "multiple" : "single",
      metadataText: JSON.stringify(q.metadata, null, 2),
      options: q.options.map(({ id, label, content, is_correct }) => ({ id, label, content, is_correct })),
    })),
  };
}

function parseMetadata(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(text.trim() || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Why the draft cannot be saved yet, in words for the editor's footer; `null` when it can. */
export function draftProblem(draft: BlockDraft): string | null {
  if (!draft.subject) return "Pick a subject";
  if (draft.questions.length === 0) return "Add at least one question";
  for (const [index, q] of draft.questions.entries()) {
    const name = draft.questions.length > 1 ? `Question ${q.label || index + 1}` : "The question";
    if (!q.prompt_content.trim()) return `${name} needs its text`;
    if (q.question_type === "mcq") {
      if (q.options.filter((o) => o.content.trim()).length < 2) return `${name} needs at least two options`;
      if (!q.options.some((o) => o.is_correct && o.content.trim())) return `${name} needs a correct option`;
    }
    if (JSON_METADATA_TYPES.includes(q.question_type) && !parseMetadata(q.metadataText)) {
      return `${name} has invalid metadata JSON`;
    }
  }
  return null;
}

function toQuestionBody(q: QuestionDraft): QuestionBody {
  const isMcq = q.question_type === "mcq";
  let metadata: Record<string, unknown> = {};
  if (isMcq) metadata = { select_mode: q.selectMode };
  else if (JSON_METADATA_TYPES.includes(q.question_type)) metadata = parseMetadata(q.metadataText) ?? {};

  return {
    ...(q.id ? { id: q.id } : {}),
    question_type: q.question_type,
    label: q.label.trim(),
    marks: q.marks.trim() || "0",
    prompt_content: q.prompt_content.trim(),
    model_answer: q.model_answer.trim(),
    explanation: q.explanation.trim(),
    metadata,
    // An MCQ option left empty is dropped; other types' options are passed through untouched.
    options: q.options
      .filter((o) => !isMcq || o.content.trim())
      .map((o) => ({
        ...(o.id ? { id: o.id } : {}),
        label: o.label,
        content: isMcq ? o.content.trim() : o.content,
        is_correct: isMcq ? Boolean(o.is_correct) : o.is_correct,
      })),
  };
}

/** The draft as the student-view preview reads it: what would be saved, keyed by the editor's own keys. */
export function toPreview(draft: BlockDraft): PreviewBlock {
  const body = toBody(draft);
  return {
    stimulus_content: draft.kind === "group" ? draft.stimulus_content : "",
    questions: body.questions.map((question, index) => ({
      ...question,
      id: draft.questions[index].key,
      options: question.options.map((option, position) => ({ ...option, id: position })),
    })),
  };
}

export function toBody(draft: BlockDraft): QuestionBlockBody {
  return {
    kind: draft.kind,
    subject: Number(draft.subject),
    chapter: draft.chapter ? Number(draft.chapter) : null,
    topics: draft.topics,
    ...(draft.kind === "group"
      ? { stimulus_type: draft.stimulus_type, stimulus_content: draft.stimulus_content.trim() }
      : {}),
    questions: draft.questions.map(toQuestionBody),
  };
}
