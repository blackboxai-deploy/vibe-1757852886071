'use client';

// Main video generation interface component

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModelSelector } from './ModelSelector';
import { GenerationProgress } from './GenerationProgress';
import { MediaUpload } from './MediaUpload';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { useAppContext } from '@/contexts/AppContext';
import { MediaFile } from '@/lib/types';

interface VideoGeneratorProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

export function VideoGenerator({ onVideoGenerated }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState([30]);
  const [resolution, setResolution] = useState('1920x1080');
  const [style, setStyle] = useState('cinematic');
  const [mediaInputs, setMediaInputs] = useState<MediaFile[]>([]);
  const [strength, setStrength] = useState([0.7]); // For img2vid/vid2vid
  const [motionBucket, setMotionBucket] = useState([127]); // For motion control

  const { state } = useAppContext();
  const { isGenerating, currentProgress, startGeneration, cancelGeneration } = useVideoGeneration();

   const handleGenerate = async () => {
    if (!prompt.trim() && mediaInputs.length === 0) return;

    const request = {
      prompt: prompt.trim(),
      model: state.selectedModel,
      mediaInputs: mediaInputs.length > 0 ? mediaInputs : undefined,
      settings: {
        duration: duration[0],
        resolution,
        style,
        strength: mediaInputs.length > 0 ? strength[0] : undefined,
        motionBucket: mediaInputs.length > 0 ? motionBucket[0] : undefined
      }
    };

    const result = await startGeneration(request);
    
    if (result && onVideoGenerated) {
      onVideoGenerated(result.videoUrl);
    }
  };

  const handleMediaChange = (media: MediaFile[]) => {
    setMediaInputs(media);
  };

  // Update example prompts based on media inputs
  const getExamplePrompts = () => {
    if (mediaInputs.length > 0) {
      const hasImage = mediaInputs.some(m => m.type === 'image');
      const hasVideo = mediaInputs.some(m => m.type === 'video');
      
      if (hasImage && hasVideo) {
        return [
          "Transform this image into a dynamic video scene with the motion style from the reference video",
          "Create a seamless transition between the image and video elements with cinematic flow",
          "Animate the image using the video's motion patterns and visual style"
        ];
      } else if (hasImage) {
        return [
          "Bring this image to life with gentle camera movements and natural lighting changes",
          "Create a cinemagraph effect with subtle motion while keeping the main subject stable",
          "Add dynamic weather effects and atmospheric elements to this scene"
        ];
      } else if (hasVideo) {
        return [
          "Create a new video with similar motion patterns but in a different setting",
          "Transform the style while maintaining the original motion and composition",
          "Generate a continuation of this video with evolved scene elements"
        ];
      }
    }
    
    return [
      "A majestic eagle soaring through mountain valleys with cinematic lighting",
      "Waves crashing on a tropical beach at sunset with golden hour lighting", 
      "A bustling cyberpunk city street at night with neon lights and rain"
    ];
  };

   const examplePrompts = getExamplePrompts();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Video Generator</CardTitle>
          <CardDescription>
            Create stunning videos using advanced AI technology. Describe your vision and watch it come to life.
          </CardDescription>
        </CardHeader>
        
         <CardContent className="space-y-6">
          <Tabs defaultValue="prompt" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="prompt">Text Prompt</TabsTrigger>
              <TabsTrigger value="media">Media Input</TabsTrigger>
              <TabsTrigger value="settings">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="prompt" className="space-y-6 mt-6">
              {/* Prompt Input */}
              <div className="space-y-3">
                <Label htmlFor="prompt">Video Description</Label>
                <Textarea
                  id="prompt"
                  placeholder={
                    mediaInputs.length > 0 
                      ? "Describe how you want to transform or animate the uploaded media..."
                      : "Describe the video you want to generate in detail..."
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                  disabled={isGenerating}
                />
                <div className="text-xs text-muted-foreground">
                  {mediaInputs.length > 0 
                    ? "Tip: Describe transformations, animations, or effects to apply to your uploaded media."
                    : "Tip: Be descriptive about lighting, camera angles, and visual style for best results."
                  }
                </div>
              </div>

              {/* Example Prompts */}
              <div className="space-y-3">
                <Label>{mediaInputs.length > 0 ? "Example Media Prompts" : "Example Prompts"}</Label>
                <div className="grid grid-cols-1 gap-2">
                  {examplePrompts.slice(0, 3).map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(example)}
                      className="text-left p-3 text-sm bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors border border-transparent hover:border-accent"
                      disabled={isGenerating}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-6">
              <MediaUpload
                onMediaChange={handleMediaChange}
                maxFiles={3}
                disabled={isGenerating}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-6">
              {/* Model Selection */}
              <ModelSelector />

              {/* Media-specific settings */}
              {mediaInputs.length > 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Transformation Strength */}
                    <div className="space-y-3">
                      <Label htmlFor="strength">Transformation Strength: {strength[0]}</Label>
                      <Slider
                        id="strength"
                        min={0.1}
                        max={1.0}
                        step={0.1}
                        value={strength}
                        onValueChange={setStrength}
                        className="w-full"
                        disabled={isGenerating}
                      />
                      <div className="text-xs text-muted-foreground">
                        How much to transform the input media (0.1 = subtle, 1.0 = dramatic)
                      </div>
                    </div>

                    {/* Motion Bucket */}
                    <div className="space-y-3">
                      <Label htmlFor="motion">Motion Level: {motionBucket[0]}</Label>
                      <Slider
                        id="motion"
                        min={1}
                        max={255}
                        step={1}
                        value={motionBucket}
                        onValueChange={setMotionBucket}
                        className="w-full"
                        disabled={isGenerating}
                      />
                      <div className="text-xs text-muted-foreground">
                        Amount of motion to add (1 = minimal, 255 = maximum)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

           {/* Basic Generation Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Duration */}
            <div className="space-y-3">
              <Label htmlFor="duration">Duration: {duration[0]}s</Label>
              <Slider
                id="duration"
                min={10}
                max={300}
                step={10}
                value={duration}
                onValueChange={setDuration}
                className="w-full"
                disabled={isGenerating}
              />
              <div className="text-xs text-muted-foreground">
                10s - 300s (5 minutes max)
              </div>
            </div>

            {/* Resolution */}
            <div className="space-y-3">
              <Label htmlFor="resolution">Resolution</Label>
              <Select value={resolution} onValueChange={setResolution} disabled={isGenerating}>
                <SelectTrigger id="resolution">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1280x720">HD (720p)</SelectItem>
                  <SelectItem value="1920x1080">Full HD (1080p)</SelectItem>
                  <SelectItem value="2560x1440">2K (1440p)</SelectItem>
                  <SelectItem value="3840x2160">4K (2160p)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Style */}
            <div className="space-y-3">
              <Label htmlFor="style">Style</Label>
              <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
                <SelectTrigger id="style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cinematic">Cinematic</SelectItem>
                  <SelectItem value="realistic">Realistic</SelectItem>
                  <SelectItem value="artistic">Artistic</SelectItem>
                  <SelectItem value="documentary">Documentary</SelectItem>
                  <SelectItem value="animation">Animation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Media Input Summary */}
          {mediaInputs.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                📎 Media Inputs ({mediaInputs.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {mediaInputs.map((media, index) => (
                  <div key={media.id} className="text-sm text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                    {media.type === 'image' ? '🖼️' : '🎥'} {media.file.name.slice(0, 20)}...
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex flex-col gap-4">
            <Button 
              onClick={handleGenerate}
              disabled={(!prompt.trim() && mediaInputs.length === 0) || isGenerating}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isGenerating 
                ? 'Generating Video...' 
                : mediaInputs.length > 0 
                  ? `Generate Video from ${mediaInputs.length} Media Input${mediaInputs.length > 1 ? 's' : ''}`
                  : 'Generate Video from Text'
              }
            </Button>

            {/* System Prompt Display */}
            <div className="bg-accent/10 rounded-lg p-4 space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">System Prompt:</Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {state.settings.systemPrompt}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Display */}
      {currentProgress && currentProgress.status !== 'idle' && (
        <GenerationProgress 
          progress={currentProgress}
          onCancel={cancelGeneration}
          showCancel={true}
        />
      )}
    </div>
  );
}