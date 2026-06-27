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

export type AssetType = "image" | "video" | "script" | "character" | "scene" | "canvas" | "storyboard";

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

// Character Design types

export type CharacterCategory = "turnaround" | "expression" | "pose" | "custom";

export interface CharacterGeneratedImage {
  url: string;
  prompt: string;
  category: CharacterCategory;
  label: string;
  createdAt: string;
}

export interface CharacterMetadata {
  description: string;
  traits: string[];
  backstory: string;
  age: string;
  gender: string;
  species: string;
  referenceImageUrl: string | null;
  generatedImages: CharacterGeneratedImage[];
  style_preset: string;
  appearance_prompt: string;
}

export const CHARACTER_CATEGORIES: { value: CharacterCategory; label: string }[] = [
  { value: "turnaround", label: "Turnaround" },
  { value: "expression", label: "Expression" },
  { value: "pose", label: "Pose" },
  { value: "custom", label: "Custom" },
];

export const CHARACTER_SUGGESTIONS: Record<CharacterCategory, string[]> = {
  turnaround: [
    "Front view, standing neutral pose",
    "Side profile view, standing",
    "Back view, looking over shoulder",
    "Three-quarter view, relaxed stance",
  ],
  expression: [
    "Happy, bright smile, eyes closed",
    "Angry, furrowed brows, clenched jaw",
    "Sad, teary eyes, slight frown",
    "Surprised, wide eyes, open mouth",
    "Confident smirk, one eyebrow raised",
    "Scared, trembling, wide eyes",
  ],
  pose: [
    "Running action pose, dynamic angle",
    "Sitting cross-legged, relaxed",
    "Fighting stance, fists raised",
    "Jumping mid-air, arms spread",
    "Leaning against wall, arms crossed",
    "Kneeling, looking up",
  ],
  custom: [],
};

export const CHARACTER_GENDERS = [
  "Male",
  "Female",
  "Non-binary",
  "Other",
] as const;

export const CHARACTER_SPECIES_SUGGESTIONS = [
  "Human",
  "Elf",
  "Dwarf",
  "Orc",
  "Robot",
  "Animal",
  "Alien",
  "Fairy",
  "Demon",
  "Angel",
  "Dragon",
  "Other",
] as const;

// Scene Design types

export type SceneEnvironment =
  | "interior"
  | "exterior"
  | "urban"
  | "rural"
  | "fantasy"
  | "sci-fi"
  | "underwater"
  | "space"
  | "forest"
  | "desert"
  | "mountain"
  | "beach";

export type SceneTimeOfDay = "dawn" | "morning" | "noon" | "afternoon" | "sunset" | "evening" | "night" | "midnight";

export type SceneWeather = "clear" | "cloudy" | "rainy" | "stormy" | "snowy" | "foggy" | "windy" | "hazy";

export type SceneMood = "peaceful" | "tense" | "mysterious" | "romantic" | "epic" | "melancholy" | "joyful" | "dark" | "whimsical" | "nostalgic";

export type SceneLighting = "natural" | "dramatic" | "soft" | "harsh" | "backlit" | "neon" | "candlelight" | "moonlight" | "volumetric" | "studio";

export interface SceneGeneratedImage {
  url: string;
  prompt: string;
  createdAt: string;
}

export interface SceneMetadata {
  description: string;
  environment: SceneEnvironment;
  time_of_day: SceneTimeOfDay;
  weather: SceneWeather;
  mood: SceneMood;
  lighting: SceneLighting;
  color_palette: string;
  style_preset: string;
  additional_details: string;
  generated_images: SceneGeneratedImage[];
}

export const SCENE_ENVIRONMENTS: { value: SceneEnvironment; label: string }[] = [
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
  { value: "urban", label: "Urban" },
  { value: "rural", label: "Rural" },
  { value: "fantasy", label: "Fantasy" },
  { value: "sci-fi", label: "Sci-Fi" },
  { value: "underwater", label: "Underwater" },
  { value: "space", label: "Space" },
  { value: "forest", label: "Forest" },
  { value: "desert", label: "Desert" },
  { value: "mountain", label: "Mountain" },
  { value: "beach", label: "Beach" },
];

export const SCENE_TIMES_OF_DAY: { value: SceneTimeOfDay; label: string }[] = [
  { value: "dawn", label: "Dawn" },
  { value: "morning", label: "Morning" },
  { value: "noon", label: "Noon" },
  { value: "afternoon", label: "Afternoon" },
  { value: "sunset", label: "Sunset" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
  { value: "midnight", label: "Midnight" },
];

export const SCENE_WEATHER_OPTIONS: { value: SceneWeather; label: string }[] = [
  { value: "clear", label: "Clear" },
  { value: "cloudy", label: "Cloudy" },
  { value: "rainy", label: "Rainy" },
  { value: "stormy", label: "Stormy" },
  { value: "snowy", label: "Snowy" },
  { value: "foggy", label: "Foggy" },
  { value: "windy", label: "Windy" },
  { value: "hazy", label: "Hazy" },
];

export const SCENE_MOODS: { value: SceneMood; label: string }[] = [
  { value: "peaceful", label: "Peaceful" },
  { value: "tense", label: "Tense" },
  { value: "mysterious", label: "Mysterious" },
  { value: "romantic", label: "Romantic" },
  { value: "epic", label: "Epic" },
  { value: "melancholy", label: "Melancholy" },
  { value: "joyful", label: "Joyful" },
  { value: "dark", label: "Dark" },
  { value: "whimsical", label: "Whimsical" },
  { value: "nostalgic", label: "Nostalgic" },
];

export const SCENE_LIGHTING_STYLES: { value: SceneLighting; label: string }[] = [
  { value: "natural", label: "Natural" },
  { value: "dramatic", label: "Dramatic" },
  { value: "soft", label: "Soft" },
  { value: "harsh", label: "Harsh" },
  { value: "backlit", label: "Backlit" },
  { value: "neon", label: "Neon" },
  { value: "candlelight", label: "Candlelight" },
  { value: "moonlight", label: "Moonlight" },
  { value: "volumetric", label: "Volumetric" },
  { value: "studio", label: "Studio" },
];

export const SCENE_COLOR_PALETTES = [
  { value: "warm", label: "Warm Tones" },
  { value: "cool", label: "Cool Tones" },
  { value: "muted", label: "Muted / Pastel" },
  { value: "vibrant", label: "Vibrant / Saturated" },
  { value: "monochrome", label: "Monochrome" },
  { value: "earth", label: "Earth Tones" },
  { value: "neon", label: "Neon / Cyberpunk" },
  { value: "sepia", label: "Sepia / Vintage" },
] as const;

export const SCENE_PRESETS = [
  { value: "cozy-room", label: "Cozy Room", environment: "interior" as SceneEnvironment, time_of_day: "evening" as SceneTimeOfDay, weather: "clear" as SceneWeather, mood: "peaceful" as SceneMood, lighting: "candlelight" as SceneLighting, palette: "warm" },
  { value: "dark-alley", label: "Dark Alley", environment: "urban" as SceneEnvironment, time_of_day: "midnight" as SceneTimeOfDay, weather: "rainy" as SceneWeather, mood: "tense" as SceneMood, lighting: "neon" as SceneLighting, palette: "neon" },
  { value: "enchanted-forest", label: "Enchanted Forest", environment: "forest" as SceneEnvironment, time_of_day: "dawn" as SceneTimeOfDay, weather: "foggy" as SceneWeather, mood: "mysterious" as SceneMood, lighting: "volumetric" as SceneLighting, palette: "cool" },
  { value: "epic-battle", label: "Epic Battle", environment: "exterior" as SceneEnvironment, time_of_day: "sunset" as SceneTimeOfDay, weather: "stormy" as SceneWeather, mood: "epic" as SceneMood, lighting: "dramatic" as SceneLighting, palette: "vibrant" },
  { value: "space-station", label: "Space Station", environment: "sci-fi" as SceneEnvironment, time_of_day: "night" as SceneTimeOfDay, weather: "clear" as SceneWeather, mood: "mysterious" as SceneMood, lighting: "neon" as SceneLighting, palette: "cool" },
  { value: "beach-sunset", label: "Beach Sunset", environment: "beach" as SceneEnvironment, time_of_day: "sunset" as SceneTimeOfDay, weather: "clear" as SceneWeather, mood: "romantic" as SceneMood, lighting: "natural" as SceneLighting, palette: "warm" },
] as const;

// Storyboard types

export type ShotType =
  | "wide"
  | "medium"
  | "close-up"
  | "extreme-close-up"
  | "over-the-shoulder"
  | "bird-eye"
  | "low-angle"
  | "high-angle"
  | "dutch-angle"
  | "pov";

export interface StoryboardPanel {
  id: string;
  order: number;
  scene_description: string;
  dialogue: string;
  action_notes: string;
  shot_type: ShotType;
  duration_seconds: number;
  image_url: string | null;
  image_prompt: string;
}

export interface StoryboardMetadata {
  title: string;
  description: string;
  panels: StoryboardPanel[];
  style_preset: string;
  aspect_ratio: string;
  source_script_id: string | null;
}

export const SHOT_TYPES: { value: ShotType; label: string }[] = [
  { value: "wide", label: "Wide Shot" },
  { value: "medium", label: "Medium Shot" },
  { value: "close-up", label: "Close-Up" },
  { value: "extreme-close-up", label: "Extreme Close-Up" },
  { value: "over-the-shoulder", label: "Over the Shoulder" },
  { value: "bird-eye", label: "Bird's Eye" },
  { value: "low-angle", label: "Low Angle" },
  { value: "high-angle", label: "High Angle" },
  { value: "dutch-angle", label: "Dutch Angle" },
  { value: "pov", label: "POV" },
];

export const STORYBOARD_ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Widescreen)" },
  { value: "4:3", label: "4:3 (Standard)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "9:16", label: "9:16 (Vertical)" },
  { value: "2.39:1", label: "2.39:1 (Cinematic)" },
] as const;
