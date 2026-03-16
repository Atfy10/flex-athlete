/**
 * videoAnalysis.services.ts
 *
 * Service layer for video analysis API calls.
 */

import { apiFetch } from "@/lib/api";
import { ApiResult } from "@/types/api";
import type { AnalyzeVideoRequest, VideoAnalysisResult } from "@/types/videoAnalysis";

// ── Service functions ─────────────────────────────────────────────────────────

export const analyzeVideo = async (
  payload: AnalyzeVideoRequest,
): Promise<ApiResult<VideoAnalysisResult>> => {
  return apiFetch<ApiResult<VideoAnalysisResult>>("/api/VideoAnalysis/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getAnalysisById = async (
  id: string,
): Promise<ApiResult<VideoAnalysisResult>> => {
  return apiFetch<ApiResult<VideoAnalysisResult>>(`/api/VideoAnalysis/${id}`);
};

export const getMyAnalyses = async (): Promise<ApiResult<VideoAnalysisResult[]>> => {
  return apiFetch<ApiResult<VideoAnalysisResult[]>>("/api/VideoAnalysis/my");
};
