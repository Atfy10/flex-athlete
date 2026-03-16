import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FilesetResolver, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Video,
  Upload,
  Brain,
  BarChart2,
  History,
  Dumbbell,
  Activity,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Trophy,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { analyzeVideo, getMyAnalyses } from "@/services/videoAnalysis.services";
import type {
  LandmarkPoint,
  FrameLandmarks,
  JointAngles,
  PoseLandmarksData,
  VideoAnalysisResult,
  ParsedAnalysis,
  AnalyzeVideoRequest,
} from "@/types/videoAnalysis";
import { POSE_LANDMARK_NAMES } from "@/types/videoAnalysis";

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

function computeAnglesFromLandmarks(
  lm: { x: number; y: number; z: number }[],
): JointAngles {
  // Indices: 11=left_shoulder, 12=right_shoulder, 13=left_elbow, 14=right_elbow,
  // 15=left_wrist, 16=right_wrist, 23=left_hip, 24=right_hip,
  // 25=left_knee, 26=right_knee, 27=left_ankle, 28=right_ankle
  return {
    leftKneeAngle: calcAngle(lm[23], lm[25], lm[27]),
    rightKneeAngle: calcAngle(lm[24], lm[26], lm[28]),
    leftHipAngle: calcAngle(lm[11], lm[23], lm[25]),
    rightHipAngle: calcAngle(lm[12], lm[24], lm[26]),
    leftShoulderAngle: calcAngle(lm[23], lm[11], lm[13]),
    rightShoulderAngle: calcAngle(lm[24], lm[12], lm[14]),
    leftElbowAngle: calcAngle(lm[11], lm[13], lm[15]),
    rightElbowAngle: calcAngle(lm[12], lm[14], lm[16]),
    trunkLean: calcAngle(
      { x: (lm[11].x + lm[12].x) / 2, y: 0 },
      { x: (lm[11].x + lm[12].x) / 2, y: (lm[11].y + lm[12].y) / 2 },
      { x: (lm[23].x + lm[24].x) / 2, y: (lm[23].y + lm[24].y) / 2 },
    ),
  };
}

function avgAngles(allAngles: JointAngles[]): JointAngles {
  const n = allAngles.length || 1;
  const sum = allAngles.reduce(
    (acc, a) => ({
      leftKneeAngle: acc.leftKneeAngle + a.leftKneeAngle,
      rightKneeAngle: acc.rightKneeAngle + a.rightKneeAngle,
      leftHipAngle: acc.leftHipAngle + a.leftHipAngle,
      rightHipAngle: acc.rightHipAngle + a.rightHipAngle,
      leftShoulderAngle: acc.leftShoulderAngle + a.leftShoulderAngle,
      rightShoulderAngle: acc.rightShoulderAngle + a.rightShoulderAngle,
      leftElbowAngle: acc.leftElbowAngle + a.leftElbowAngle,
      rightElbowAngle: acc.rightElbowAngle + a.rightElbowAngle,
      trunkLean: acc.trunkLean + a.trunkLean,
    }),
    {
      leftKneeAngle: 0, rightKneeAngle: 0,
      leftHipAngle: 0, rightHipAngle: 0,
      leftShoulderAngle: 0, rightShoulderAngle: 0,
      leftElbowAngle: 0, rightElbowAngle: 0,
      trunkLean: 0,
    },
  );
  return {
    leftKneeAngle: sum.leftKneeAngle / n,
    rightKneeAngle: sum.rightKneeAngle / n,
    leftHipAngle: sum.leftHipAngle / n,
    rightHipAngle: sum.rightHipAngle / n,
    leftShoulderAngle: sum.leftShoulderAngle / n,
    rightShoulderAngle: sum.rightShoulderAngle / n,
    leftElbowAngle: sum.leftElbowAngle / n,
    rightElbowAngle: sum.rightElbowAngle / n,
    trunkLean: sum.trunkLean / n,
  };
}

function tryParseAnalysis(raw: ParsedAnalysis | string | null | undefined): ParsedAnalysis | null {
  if (!raw) return null;

  // If it's already a parsed object, return it directly
  if (typeof raw === "object") return raw as ParsedAnalysis;

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const stripped = raw
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  for (const candidate of [stripped, raw]) {
    // 1. Try direct parse
    try {
      const obj = JSON.parse(candidate);
      if (obj && typeof obj === "object") return obj as ParsedAnalysis;
    } catch { /* continue */ }

    // 2. Extract first { ... } block (greedy)
    try {
      const match = candidate.match(/\{[\s\S]*\}/);
      if (match) {
        const obj = JSON.parse(match[0]);
        if (obj && typeof obj === "object") return obj as ParsedAnalysis;
      }
    } catch { /* continue */ }
  }
  return null;
}

/** Displays raw AI text when full parsing fails — formats it if it's valid JSON */
function RawAnalysisFallback({ raw }: { raw: string | object }) {
  let parsed: Record<string, unknown> | null = null;

  if (typeof raw === "object" && raw !== null) {
    parsed = raw as Record<string, unknown>;
  } else if (typeof raw === "string") {
    try {
      const s = raw.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();
      const obj = JSON.parse(s);
      if (obj && typeof obj === "object") parsed = obj;
    } catch {
      try {
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) {
          const obj = JSON.parse(m[0]);
          if (obj && typeof obj === "object") parsed = obj;
        }
      } catch { /* give up */ }
    }
  }

  if (!parsed) {
    return (
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {typeof raw === "string" ? raw : JSON.stringify(raw, null, 2)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Object.entries(parsed).map(([key, value]) => (
        <div key={key} className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            {key.replace(/([A-Z])/g, " $1").trim()}
          </p>
          {Array.isArray(value) ? (
            <ul className="space-y-1">
              {(value as unknown[]).map((item, i) => (
                <li key={i} className="text-sm">
                  {item && typeof item === "object" ? (
                    <div className="pl-2 border-l border-border space-y-0.5">
                      {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                        <p key={k}>
                          <span className="font-medium text-xs text-muted-foreground">{k}: </span>
                          {String(v)}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <span className="flex gap-1.5"><span className="text-primary shrink-0">•</span>{String(item)}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">{String(value)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VideoAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [movementType, setMovementType] = useState("running");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [landmarksData, setLandmarksData] = useState<PoseLandmarksData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ParsedAnalysis | null>(null);
  const [rawAnalysis, setRawAnalysis] = useState<string | object>("");

  // Fetch previous analyses
  const { data: previousAnalyses } = useQuery({
    queryKey: ["video-analyses"],
    queryFn: getMyAnalyses,
    select: (res) => res.data,
  });

  // Mutation for sending analysis
  const analyzeMutation = useMutation({
    mutationFn: analyzeVideo,
    onSuccess: (res) => {
      if (res.isSuccess && res.data) {
        const parsed = tryParseAnalysis(res.data.aiAnalysisResult);
        setAnalysisResult(parsed);
        setRawAnalysis(res.data.aiAnalysisResult);
        toast({ title: "Analysis Complete!", description: "Check the results below." });
        queryClient.invalidateQueries({ queryKey: ["video-analyses"] });
      } else {
        toast({ title: "Error", description: res.message, variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "An error occurred during analysis.", variant: "destructive" });
    },
  });

  // Cleanup video URL
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setLandmarksData(null);
    setAnalysisResult(null);
    setRawAnalysis("");
    setProgress(0);
  }, [videoUrl]);

  // ── MediaPipe Processing ──────────────────────────────────────────────────

  const processVideo = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !videoFile) return;

    setProcessing(true);
    setProgress(0);
    setLandmarksData(null);
    setAnalysisResult(null);

    try {
      // Initialize MediaPipe
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );
      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d")!;

      // Wait for video metadata
      await new Promise<void>((resolve) => {
        if (video.readyState >= 1) return resolve();
        video.onloadedmetadata = () => resolve();
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const duration = video.duration;
      const sampleInterval = 0.2; // sample every 200ms
      const totalSamples = Math.floor(duration / sampleInterval);

      const frames: FrameLandmarks[] = [];
      const allAngles: JointAngles[] = [];
      const drawUtils = new DrawingUtils(ctx);

      for (let i = 0; i <= totalSamples; i++) {
        const time = i * sampleInterval;
        video.currentTime = time;

        await new Promise<void>((resolve) => {
          video.onseeked = () => resolve();
        });

        const timestampMs = time * 1000;
        const result = poseLandmarker.detectForVideo(video, timestampMs);

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks: LandmarkPoint[] = result.landmarks[0].map((lm, idx) => ({
            name: POSE_LANDMARK_NAMES[idx] || `landmark_${idx}`,
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility ?? 0,
          }));

          frames.push({ frameIndex: i, timestampMs, landmarks });

          const angles = computeAnglesFromLandmarks(result.landmarks[0]);
          allAngles.push(angles);

          // Draw skeleton on canvas for visual feedback
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          for (const poseLandmarks of result.landmarks) {
            drawUtils.drawLandmarks(poseLandmarks, {
              radius: 3,
              color: "#00FF00",
              fillColor: "#00FF00",
            });
            drawUtils.drawConnectors(poseLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
              color: "#00FFFF",
              lineWidth: 2,
            });
          }
        }

        setProgress(Math.round(((i + 1) / (totalSamples + 1)) * 100));
      }

      poseLandmarker.close();

      if (frames.length === 0) {
        toast({
          title: "No Person Detected",
          description: "Make sure the video clearly shows a person.",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // Only send first, middle, and last frame to keep payload small
      const sampledFrames = [
        frames[0],
        frames[Math.floor(frames.length / 2)],
        frames[frames.length - 1],
      ].filter(Boolean);

      const data: PoseLandmarksData = {
        frames: sampledFrames,
        averageAngles: avgAngles(allAngles),
        totalFramesProcessed: frames.length,
        videoDurationSeconds: duration,
      };

      setLandmarksData(data);
      toast({
        title: "Processing Complete!",
        description: `Analyzed ${frames.length} frames. Ready to send to AI.`,
      });
    } catch (err) {
      console.error("MediaPipe processing error:", err);
      toast({
        title: "Processing Error",
        description: "An error occurred while analyzing the video with MediaPipe.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  }, [videoFile, toast]);

  const handleAnalyze = useCallback(() => {
    if (!landmarksData) return;
    const payload: AnalyzeVideoRequest = {
      movementType,
      landmarks: landmarksData,
    };
    analyzeMutation.mutate(payload);
  }, [landmarksData, movementType, analyzeMutation]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Athlete Video Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Upload an athlete's video and we'll analyze their movement and provide recommendations.
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <Brain className="h-4 w-4 text-primary" />
          AI Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload & Video Section */}
        <Card className="card-athletic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Movement Type */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Movement Type</label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="walking">Walking</SelectItem>
                  <SelectItem value="jumping">Jumping</SelectItem>
                  <SelectItem value="squatting">Squatting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Upload zone / Video preview */}
            {videoUrl ? (
              <>
                <div className="relative rounded-lg overflow-hidden border border-border max-h-[280px]">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full max-h-[280px] object-contain rounded-lg"
                    controls
                    muted
                  />
                  <button
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded border border-border hover:bg-background transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processing}
                  >
                    Change
                  </button>
                </div>
                {/* Skeleton preview (separate from video) */}
                <div
                  className="rounded-lg overflow-hidden border border-border bg-black"
                  style={{ display: landmarksData ? "block" : "none" }}
                >
                  <p className="text-xs text-muted-foreground px-3 py-1.5 bg-muted/50 flex items-center gap-1.5">
                    <Activity className="h-3 w-3" />
                    Pose Detection Result
                  </p>
                  <canvas
                    ref={canvasRef}
                    className="w-full max-h-[320px] object-contain"
                  />
                </div>
              </>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => !processing && fileInputRef.current?.click()}
              >
                <div className="p-3 rounded-full bg-primary/10">
                  <Video className="h-7 w-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to choose a video</p>
                  <p className="text-xs text-muted-foreground mt-0.5">MP4, MOV, AVI and more</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Progress bar */}
            {processing && (
              <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Activity className="h-3.5 w-3.5 animate-pulse" />
                    Analyzing video with MediaPipe...
                  </span>
                  <span className="font-medium tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                onClick={processVideo}
                disabled={!videoFile || processing}
                variant="outline"
                className="flex-1"
              >
                <Video className="h-4 w-4 mr-1.5" />
                {processing ? "Processing..." : "Process Video"}
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={!landmarksData || analyzeMutation.isPending}
                variant="default"
                className="flex-1"
              >
                <Brain className="h-4 w-4 mr-1.5" />
                {analyzeMutation.isPending ? "Analyzing..." : "Analyze with AI"}
              </Button>
            </div>

            {/* Stats grid after processing */}
            {landmarksData && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Frames Analyzed</p>
                  <p className="font-semibold text-sm">{landmarksData.totalFramesProcessed}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Video Duration</p>
                  <p className="font-semibold text-sm">{landmarksData.videoDurationSeconds.toFixed(1)}s</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Left Knee Angle (avg)</p>
                  <p className="font-semibold text-sm">{landmarksData.averageAngles.leftKneeAngle.toFixed(1)}°</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Right Knee Angle (avg)</p>
                  <p className="font-semibold text-sm">{landmarksData.averageAngles.rightKneeAngle.toFixed(1)}°</p>
                </div>
                <div className="bg-muted rounded-lg p-3 col-span-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Trunk Lean</p>
                  <p className="font-semibold text-sm">{landmarksData.averageAngles.trunkLean.toFixed(1)}°</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="card-athletic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyzeMutation.isPending && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-3">
                  <div className="p-4 rounded-full bg-primary/10 mx-auto w-fit">
                    <Brain className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <p className="text-muted-foreground text-sm">Analyzing with AI...</p>
                </div>
              </div>
            )}

            {analysisResult ? (
              <div className="space-y-4">
                {/* Posture Analysis */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Posture Analysis
                    <span className="text-muted-foreground/60 font-normal normal-case tracking-normal ml-1">· تحليل الوضعية</span>
                  </h3>
                  <p className="text-sm leading-relaxed">{analysisResult.bodyPostureAnalysis}</p>
                </div>

                <Separator />

                {/* Strengths */}
                {(analysisResult.strengths?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-1.5 text-green-600">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Strengths <span className="font-normal text-green-600/70">· نقاط القوة</span></span>
                    </h3>
                    <ul className="space-y-1.5">
                      {analysisResult.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/50 rounded-md px-3 py-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Separator />

                {/* Weaknesses */}
                {(analysisResult.weaknesses?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-1.5 text-red-600">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>Weaknesses <span className="font-normal text-red-600/70">· نقاط الضعف</span></span>
                    </h3>
                    <ul className="space-y-1.5">
                      {analysisResult.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-md px-3 py-2">
                          <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Separator />

                {/* Recommended Exercises */}
                {(analysisResult.recommendedExercises?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-1.5">
                      <Dumbbell className="h-4 w-4 text-primary shrink-0" />
                      <span>Recommended Exercises <span className="font-normal text-muted-foreground">· تمارين مقترحة</span></span>
                    </h3>
                    <div className="space-y-2">
                      {analysisResult.recommendedExercises.map((ex, i) => (
                        <div key={i} className="bg-muted rounded-lg p-3 border border-border">
                          <p className="font-medium text-sm">{ex.name}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{ex.description}</p>
                          {ex.purpose && (
                            <p className="text-xs text-primary mt-1.5 font-medium">
                              Goal / الهدف: {ex.purpose}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Suitable Sports */}
                {(analysisResult.suitableSports?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-1.5">
                      <Trophy className="h-4 w-4 text-primary shrink-0" />
                      <span>Suitable Sports <span className="font-normal text-muted-foreground">· رياضات مناسبة</span></span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.suitableSports.map((sp, i) => (
                        <div key={i} className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-3 flex-1 min-w-[180px]">
                          <p className="font-medium text-sm text-blue-700 dark:text-blue-300">{sp.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{sp.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Tips */}
                {(analysisResult.generalTips?.length ?? 0) > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-1.5">
                        <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>General Tips <span className="font-normal text-muted-foreground">· نصائح عامة</span></span>
                      </h3>
                      <ul className="space-y-1.5">
                        {analysisResult.generalTips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            ) : rawAnalysis ? (
              <RawAnalysisFallback raw={rawAnalysis} />
            ) : !analyzeMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <div className="p-4 rounded-full bg-muted">
                  <BarChart2 className="h-8 w-8 opacity-40" />
                </div>
                <p className="text-sm">Upload and process a video to see the results here.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Previous Analyses */}
      {previousAnalyses && previousAnalyses.length > 0 && (
        <Card className="card-athletic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Previous Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {previousAnalyses.map((analysis: VideoAnalysisResult) => {
                const parsed = tryParseAnalysis(analysis.aiAnalysisResult);
                return (
                  <div
                    key={analysis.id}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all duration-150"
                    onClick={() => {
                      setAnalysisResult(parsed);
                      setRawAnalysis(analysis.aiAnalysisResult);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{analysis.movementType}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(analysis.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {parsed && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {parsed.bodyPostureAnalysis}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
