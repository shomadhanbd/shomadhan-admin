import { previewHtml } from "@/lib/format";
import type { QuestionBlock } from "@/features/question-bank/types";

/** The line a block is recognised by, for `<RichContent>`: a group's stimulus, else its first question. */
export function blockPreview(block: Pick<QuestionBlock, "stimulus_content" | "questions">): string {
  return previewHtml(block.stimulus_content) || previewHtml(block.questions[0]?.prompt_content);
}
