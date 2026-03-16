// ── MediaPipe Pose Landmark Types ──────────────────────────────────────────

export interface LandmarkPoint {
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface FrameLandmarks {
  frameIndex: number;
  timestampMs: number;
  landmarks: LandmarkPoint[];
}

export interface JointAngles {
  leftKneeAngle: number;
  rightKneeAngle: number;
  leftHipAngle: number;
  rightHipAngle: number;
  leftShoulderAngle: number;
  rightShoulderAngle: number;
  leftElbowAngle: number;
  rightElbowAngle: number;
  trunkLean: number;
}

export interface PoseLandmarksData {
  frames: FrameLandmarks[];
  averageAngles: JointAngles;
  totalFramesProcessed: number;
  videoDurationSeconds: number;
}

// ── API Request/Response Types ────────────────────────────────────────────

export interface AnalyzeVideoRequest {
  movementType: string;
  landmarks: PoseLandmarksData;
}

export interface VideoAnalysisResult {
  id: string;
  movementType: string;
  aiAnalysisResult: ParsedAnalysis | string;
  createdAt: string;
}

// ── Parsed AI Analysis (structured JSON from AI response) ─────────────────

export interface RecommendedExercise {
  name: string;
  description: string;
  purpose: string;
}

export interface SuitableSport {
  name: string;
  reason: string;
}

export interface ParsedAnalysis {
  bodyPostureAnalysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendedExercises: RecommendedExercise[];
  suitableSports: SuitableSport[];
  generalTips: string[];
}

// ── MediaPipe Landmark Names (33 points) ──────────────────────────────────

export const POSE_LANDMARK_NAMES = [
  "nose",
  "left_eye_inner",
  "left_eye",
  "left_eye_outer",
  "right_eye_inner",
  "right_eye",
  "right_eye_outer",
  "left_ear",
  "right_ear",
  "mouth_left",
  "mouth_right",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_pinky",
  "right_pinky",
  "left_index",
  "right_index",
  "left_thumb",
  "right_thumb",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
  "left_heel",
  "right_heel",
  "left_foot_index",
  "right_foot_index",
] as const;
