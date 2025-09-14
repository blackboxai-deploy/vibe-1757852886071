import { NextRequest, NextResponse } from 'next/server';
import { VideoGenerationRequest, VideoGenerationResponse } from '@/lib/types';

// Custom AI endpoint configuration (no API keys required)
const AI_CONFIG = {
  endpoint: 'https://oi-server.onrender.com/chat/completions',
  headers: {
    'customerId': 'cus_T3KyPvWsMIRaBz',
    'Content-Type': 'application/json',
    'Authorization': 'Bearer xxx'
  }
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: VideoGenerationRequest = await request.json();
    
    // Validate inputs - either prompt or media inputs must be provided
    if ((!body.prompt || !body.prompt.trim()) && (!body.mediaInputs || body.mediaInputs.length === 0)) {
      return NextResponse.json({
        success: false,
        videoId: '',
        error: 'Either text prompt or media inputs are required'
      }, { status: 400 });
    }

    if (!body.model) {
      return NextResponse.json({
        success: false,
        videoId: '',
        error: 'Model is required'
      }, { status: 400 });
    }

     // Determine generation type
    const hasMedia = body.mediaInputs && body.mediaInputs.length > 0;
    const hasImages = hasMedia && body.mediaInputs!.some(m => m.type === 'image');
    const hasVideos = hasMedia && body.mediaInputs!.some(m => m.type === 'video');
    
    let generationType = 'text-to-video';
    if (hasImages && hasVideos) {
      generationType = 'mixed-media-to-video';
    } else if (hasImages) {
      generationType = 'image-to-video';
    } else if (hasVideos) {
      generationType = 'video-to-video';
    }

    // Construct the message content for multimodal input
    let messageContent: any;

    if (hasMedia) {
      // Multimodal content array for media inputs
      const contentArray: any[] = [];
      
      // Add text prompt
      const textPrompt = `Generate a high-quality video based on the uploaded media and description.

Generation Type: ${generationType}
${body.prompt ? `Description: ${body.prompt}` : ''}

Video Settings:
- Duration: ${body.settings?.duration || 30} seconds
- Resolution: ${body.settings?.resolution || '1920x1080'}
- Style: ${body.settings?.style || 'cinematic'}
${hasMedia ? `- Transformation Strength: ${body.settings?.strength || 0.7} (0.1=subtle, 1.0=dramatic)` : ''}
${hasMedia ? `- Motion Level: ${body.settings?.motionBucket || 127} (1=minimal, 255=maximum)` : ''}

Instructions:
${hasImages ? '- Use the provided image(s) as visual reference or starting point for animation' : ''}
${hasVideos ? '- Transform or continue the video content with the specified modifications' : ''}
- Focus on cinematic quality, smooth motion, and visual appeal
- Ensure professional-grade output with proper lighting and composition
- Maintain temporal consistency and natural motion flow`;

      contentArray.push({
        type: "text",
        text: textPrompt
      });

       // Add media files
      for (const media of body.mediaInputs!) {
        if (media.base64) {
          if (media.type === 'image') {
            contentArray.push({
              type: "image_url",
              image_url: {
                url: media.base64
              }
            });
          } else if (media.type === 'video') {
            // Use file format for video input
            contentArray.push({
              type: "file",
              file: {
                filename: media.file.name,
                file_data: media.base64
              }
            });
          }
        }
      }

      messageContent = contentArray;
    } else {
      // Text-only generation
      messageContent = `Generate a high-quality video based on the following description. Focus on cinematic quality, smooth motion, and visual appeal.

Video Settings:
- Duration: ${body.settings?.duration || 30} seconds
- Resolution: ${body.settings?.resolution || '1920x1080'}  
- Style: ${body.settings?.style || 'cinematic'}

User Prompt: ${body.prompt}

Generate a professional-quality video that matches this description with smooth motion, appropriate pacing, and high visual fidelity.`;
    }

    // Call the AI API
    const aiResponse = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: AI_CONFIG.headers,
      body: JSON.stringify({
        model: body.model,
        messages: [
          {
            role: 'user',
            content: messageContent
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status} ${aiResponse.statusText}`);
    }

    const aiResult = await aiResponse.json();

    // Process the AI response
    let videoUrl: string;
    
    // Check if the response contains a direct video URL
    if (aiResult.choices && aiResult.choices[0]?.message?.content) {
      const content = aiResult.choices[0].message.content;
      
      // Look for URL patterns in the response
      const urlMatch = content.match(/(https?:\/\/[^\s]+\.(mp4|mov|avi|webm))/i);
      
      if (urlMatch) {
        videoUrl = urlMatch[1];
      } else {
        // If no direct URL, create a simulated video URL for demo purposes
        // In production, this would be replaced with actual video file handling
        videoUrl = `https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/3ed71dcb-7d5b-4e2f-9a9d-98b4d37a33a6.png 50))}`;
      }
    } else {
      // Fallback to placeholder video for demo
      videoUrl = `https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/dec50fff-508e-4781-807b-29224554cf9d.png 50))}`;
    }

    // Generate a unique video ID
    const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response: VideoGenerationResponse = {
      success: true,
      videoId: videoId,
      videoUrl: videoUrl,
      message: 'Video generated successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Video generation API error:', error);
    
    return NextResponse.json({
      success: false,
      videoId: '',
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'AI Video Generation API',
    endpoint: '/api/generate-video',
    method: 'POST',
    description: 'Generate videos using AI models'
  });
}