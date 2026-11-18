import api from "@/lib/api";
import type { MockTestBody, MockTestDetail } from "./types";

/** `/admin/mock-tests/`: scheduled tests shown to a chosen audience. */
export const MOCK_TESTS = "/admin/mock-tests/";

export const mockTestKeys = {
  all: ["mock-tests"] as const,
};

export const mockTestsApi = {
  get: async (id: number) => (await api.get<MockTestDetail>(`${MOCK_TESTS}${id}/`)).data,
  create: async (body: MockTestBody) => (await api.post<MockTestDetail>(MOCK_TESTS, body)).data,
  update: async (id: number, body: Partial<MockTestBody>) =>
    (await api.patch<MockTestDetail>(`${MOCK_TESTS}${id}/`, body)).data,
};
