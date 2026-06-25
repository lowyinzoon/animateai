export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type AssetType = "image" | "video" | "script" | "character" | "scene" | "canvas";

export type CanvasTool = "select" | "text" | "rect" | "circle" | "line" | "brush";

export interface CanvasMetadata {
  fabricJson: object;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
}

export const CANVAS_PRESETS = [
  { label: "Full HD (1920x1080)", width: 1920, height: 1080 },
  { label: "HD (1280x720)", width: 1280, height: 720 },
  { label: "Square (1080x1080)", width: 1080, height: 1080 },
  { label: "Portrait (1080x1920)", width: 1080, height: 1920 },
] as const;

export interface Asset {
  id: string;
  user_id: string;
  project_id: string | null;
  type: AssetType;
  name: string | null;
  prompt: string | null;
  file_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Script {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  content: string | null;
  genre: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImageGenerationParams {
  prompt: string;
  negative_prompt?: string;
  width: number;
  height: number;
  style_preset?: string;
}

export interface ScriptGenerationParams {
  prompt: string;
  genre: string;
  tone?: string;
  length?: "short" | "medium" | "long";
}

export interface GenerationResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export const IMAGE_STYLES = [
  { value: "anime", label: "Anime" },
  { value: "digital-art", label: "Digital Art" },
  { value: "photographic", label: "Photographic" },
  { value: "comic-book", label: "Comic Book" },
  { value: "fantasy-art", label: "Fantasy Art" },
  { value: "analog-film", label: "Analog Film" },
  { value: "cinematic", label: "Cinematic" },
  { value: "3d-model", label: "3D Model" },
  { value: "pixel-art", label: "Pixel Art" },
  { value: "line-art", label: "Line Art" },
] as const;

export const IMAGE_SIZES = [
  { value: "1024x1024", label: "1024 x 1024 (Square)", width: 1024, height: 1024 },
  { value: "1536x1024", label: "1536 x 1024 (Landscape)", width: 1536, height: 1024 },
  { value: "1024x1536", label: "1024 x 1536 (Portrait)", width: 1024, height: 1536 },
] as const;

export const SCRIPT_GENRES = [
  "Action",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Mystery",
  "Adventure",
  "Documentary",
  "Animation",
] as const;
