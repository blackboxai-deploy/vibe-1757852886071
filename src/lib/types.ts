// TypeScript definitions for the AI Video Generation App

export interface GeneratedVideo {
  id: string;
  prompt: string;
  model: string;
  videoUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
  duration?: number;
  status: 'generating' | 'completed' | 'failed';
  metadata?: {
    resolution?: string;
    fileSize?: number;
    format?: string;
  };
}

export interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'video';
  url: string;
  base64?: string;
  thumbnail?: string;
}

export interface VideoGenerationRequest {
  prompt: string;
  model: string;
  mediaInputs?: MediaFile[];
  settings?: {
    duration?: number;
    resolution?: string;
    style?: string;
    strength?: number; // For img2vid/vid2vid strength (0-1)
    motionBucket?: number; // For motion control
  };
}

export interface VideoGenerationResponse {
  success: boolean;
  videoId: string;
  message?: string;
  videoUrl?: string;
  error?: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  maxDuration: number;
  isAvailable: boolean;
  capabilities: string[];
}

export interface GenerationProgress {
  status: 'idle' | 'preparing' | 'generating' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  estimatedTimeRemaining?: number;
}

export interface AppSettings {
  defaultModel: string;
  systemPrompt: string;
  autoSave: boolean;
  videoQuality: 'standard' | 'high' | 'ultra';
}

export interface AppState {
  videos: GeneratedVideo[];
  currentGeneration: GenerationProgress | null;
  settings: AppSettings;
  selectedModel: string;
}