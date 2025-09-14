'use client';

// Media upload component for images and videos

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'video';
  url: string;
  base64?: string;
  thumbnail?: string;
}

interface MediaUploadProps {
  onMediaChange?: (media: MediaFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

export function MediaUpload({ 
  onMediaChange, 
  maxFiles = 3, 
  acceptedTypes = ['image/*', 'video/*'],
  disabled = false 
}: MediaUploadProps) {
  const [uploadedMedia, setUploadedMedia] = useState<MediaFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File): Promise<MediaFile | null> => {
    try {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      
      // Convert to base64 for API transmission
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Generate thumbnail for video
      let thumbnail: string | undefined;
      if (type === 'video') {
        thumbnail = await generateVideoThumbnail(file);
      }

      return {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        type,
        url,
        base64,
        thumbnail
      };
    } catch (err) {
      console.error('Error processing file:', err);
      return null;
    }
  }, []);

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.currentTime = 1; // Seek to 1 second
      });
      
      video.addEventListener('seeked', () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          resolve(thumbnail);
        } else {
          reject(new Error('Canvas context not available'));
        }
      });
      
      video.addEventListener('error', reject);
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (disabled) return;
    
    setIsProcessing(true);
    setError(null);
    
    const newFiles = Array.from(files);
    const remainingSlots = maxFiles - uploadedMedia.length;
    const filesToProcess = newFiles.slice(0, remainingSlots);

    // Validate file types and sizes
    const invalidFiles = filesToProcess.filter(file => {
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });
      const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB max
      return !isValidType || !isValidSize;
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid files detected. Please ensure files are images/videos under 100MB.`);
      setIsProcessing(false);
      return;
    }

    try {
      const processedFiles = await Promise.all(
        filesToProcess.map(processFile)
      );
      
      const validFiles = processedFiles.filter((file): file is MediaFile => file !== null);
      const updatedMedia = [...uploadedMedia, ...validFiles];
      
      setUploadedMedia(updatedMedia);
      onMediaChange?.(updatedMedia);
    } catch (err) {
      setError('Error processing files. Please try again.');
      console.error('File processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedMedia, maxFiles, acceptedTypes, disabled, processFile, onMediaChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    const fileToRemove = uploadedMedia.find(f => f.id === fileId);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    
    const updatedMedia = uploadedMedia.filter(f => f.id !== fileId);
    setUploadedMedia(updatedMedia);
    onMediaChange?.(updatedMedia);
  }, [uploadedMedia, onMediaChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media Upload</CardTitle>
        <CardDescription>
          Add images or videos to use as reference for AI generation. Supports JPG, PNG, MP4, MOV formats.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-primary bg-primary/10' 
              : 'border-border hover:border-accent'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="space-y-3">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-sm"></div>
            </div>
            
            <div>
              <p className="text-sm font-medium">
                {isProcessing ? 'Processing files...' : 'Drop files here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Images (JPG, PNG) and Videos (MP4, MOV) • Max 100MB each • {uploadedMedia.length}/{maxFiles} files
              </p>
            </div>
            
            {!disabled && !isProcessing && (
              <Button variant="outline" size="sm" disabled={uploadedMedia.length >= maxFiles}>
                Choose Files
              </Button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          className="hidden"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          disabled={disabled}
        />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Uploaded Files Display */}
        {uploadedMedia.length > 0 && (
          <div className="space-y-3">
            <Label>Uploaded Media ({uploadedMedia.length})</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {uploadedMedia.map((media) => (
                <div key={media.id} className="border rounded-lg overflow-hidden">
                  {/* Media Preview */}
                  <div className="aspect-video bg-accent/10 relative">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt="Uploaded media"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        {media.thumbnail ? (
                          <img
                            src={media.thumbnail}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[8px] border-l-black border-y-[6px] border-y-transparent ml-1"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(media.id);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm"
                      disabled={disabled}
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Media Info */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={media.type === 'image' ? 'default' : 'secondary'}>
                        {media.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(media.file.size)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {media.file.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Tips */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Media Usage Tips</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>Images:</strong> Used as visual reference or starting point for video generation</li>
            <li>• <strong>Videos:</strong> AI will analyze motion, style, and content for new video creation</li>
            <li>• <strong>Quality:</strong> Higher resolution media typically produces better AI results</li>
            <li>• <strong>Formats:</strong> Best results with JPG/PNG images and MP4/MOV videos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}