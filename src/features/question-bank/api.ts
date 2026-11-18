import api from "@/lib/api";
import type { QuestionBlock, QuestionBlockBody } from "./types";

/** `/admin/question-blocks/`: a standalone question or a stimulus group, saved with everything inside it. */
export const QUESTION_BLOCKS = "/admin/question-blocks/";

export const questionBlockKeys = {
  all: ["question-blocks"] as const,
};

export const questionBlocksApi = {
  get: async (id: number) => (await api.get<QuestionBlock>(`${QUESTION_BLOCKS}${id}/`)).data,
  create: async (body: QuestionBlockBody) => (await api.post<QuestionBlock>(QUESTION_BLOCKS, body)).data,
  update: async (id: number, body: QuestionBlockBody) =>
    (await api.patch<QuestionBlock>(`${QUESTION_BLOCKS}${id}/`, body)).data,
  remove: async (id: number) => {
    await api.delete(`${QUESTION_BLOCKS}${id}/`);
  },
};
