// lib/videoGenerator.ts
import { FFmpegKit, FFmpegKitConfig, ReturnCode } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Platform } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import { Project, Scene } from '../db/models';
import { toast } from './toast';
import { handleError } from './errorHandling';

interface VideoGenerationOptions {
  duration?: number; // Duration per scene in seconds
  transition?: 'fade' | 'wipe' | 'slide' | 'none';
  resolution?: '720p' | '1080p';
  textPosition?: 'bottom' | 'top' | 'none';
  textColor?: string;
  backgroundColor?: string;
  onProgress?: (progress: number) => void;
}

const DEFAULT_OPTIONS: VideoGenerationOptions = {
  duration: 5,
  transition: 'fade',
  resolution: '720p',
  textPosition: 'bottom',
  textColor: 'white',
  backgroundColor: 'black',
};

/**
 * Generates a video from a project's scenes
 * @param database WatermelonDB database instance
 * @param projectId ID of the project to generate video for
 * @param options Video generation options
 * @returns Promise resolving to the local URI of the generated video
 */
export async function generateVideo(
  database: Database,
  projectId: string,
  options: VideoGenerationOptions = {}
): Promise<string> {
  // Merge default options with provided options
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Request media library permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Media library permissions not granted');
    }
    
    // Get project and scenes
    const project = await database.get<Project>('projects').find(projectId);
    const scenes = await project.scenes.fetch();
    
    // Validate scenes
    if (scenes.length === 0) {
      throw new Error('No scenes found for this project');
    }
    
    // Check if all scenes have images
    const missingImages = scenes.filter(scene => !scene.image).length;
    if (missingImages > 0) {
      throw new Error(`${missingImages} scenes are missing images`);
    }
    
    // Create temporary directory for video processing
    const tempDir = `${FileSystem.cacheDirectory}video_${projectId}/`;
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    
    // Prepare FFmpeg command
    const outputPath = `${tempDir}output.mp4`;
    
    // Build the complex FFmpeg command
    const command = await buildFFmpegCommand(scenes, outputPath, opts);
    
    // Execute FFmpeg command
    return new Promise((resolve, reject) => {
      let lastProgress = 0;
      
      FFmpegKit.executeAsync(
        command,
        async (session) => {
          const returnCode = await session.getReturnCode();
          
          if (ReturnCode.isSuccess(returnCode)) {
            try {
              // Save to media library
              const asset = await MediaLibrary.createAssetAsync(outputPath);
              const album = await MediaLibrary.getAlbumAsync('Tefereth Scripts');
              
              if (album === null) {
                await MediaLibrary.createAlbumAsync('Tefereth Scripts', asset, false);
              } else {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
              }
              
              // Clean up temp files
              await FileSystem.deleteAsync(tempDir, { idempotent: true });
              
              // Return the URI of the saved video
              resolve(asset.uri);
            } catch (error) {
              reject(new Error(`Failed to save video: ${error.message}`));
            }
          } else {
            const logs = await session.getAllLogs();
            const errorMessage = logs.map(log => log.getMessage()).join('\\n');
            reject(new Error(`FFmpeg failed: ${errorMessage}`));
          }
        },
        (log) => {
          // Parse progress from FFmpeg logs
          const progressMatch = log.getMessage().match(/time=([0-9:.]+)/);
          if (progressMatch && progressMatch[1]) {
            const timeString = progressMatch[1];
            const [hours, minutes, seconds] = timeString.split(':').map(Number);
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            const totalDuration = scenes.length * opts.duration;
            const progress = Math.min(totalSeconds / totalDuration, 1);
            
            // Only call onProgress if progress has changed significantly
            if (progress - lastProgress > 0.01) {
              lastProgress = progress;
              opts.onProgress?.(progress);
            }
          }
        },
        (statistics) => {
          // Additional statistics if needed
        }
      );
    });
  } catch (error) {
    handleError(error, {
      operation: 'generateVideo',
      projectId,
    });
    throw error;
  }
}

/**
 * Builds the FFmpeg command for video generation
 */
async function buildFFmpegCommand(
  scenes: Scene[],
  outputPath: string,
  options: VideoGenerationOptions
): Promise<string> {
  const { duration, transition, resolution, textPosition, textColor, backgroundColor } = options;
  
  // Determine resolution dimensions
  const width = resolution === '1080p' ? 1920 : 1280;
  const height = resolution === '1080p' ? 1080 : 720;
  
  // Prepare filter complex parts
  let inputs = '';
  let filterComplex = '';
  let concatParts = '';
  
  // Process each scene
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const imageUri = scene.image;
    
    // Add input for this scene's image
    inputs += ` -loop 1 -t ${duration} -i "${imageUri}"`;
    
    // Create filter for this scene
    let sceneFilter = `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:${backgroundColor}`;
    
    // Add text overlay if needed
    if (textPosition !== 'none' && scene.text) {
      const escapedText = scene.text
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .substring(0, 100); // Limit text length
      
      const textY = textPosition === 'bottom' ? height - 80 : 40;
      
      sceneFilter += `,drawtext=text='${escapedText}':fontcolor=${textColor}:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=${textY}`;
    }
    
    // Name this output
    sceneFilter += `[v${i}];`;
    filterComplex += sceneFilter;
    
    // Add to concat list
    concatParts += `[v${i}]`;
  }
  
  // Add transitions between scenes if needed
  if (transition !== 'none' && scenes.length > 1) {
    let transitionFilterComplex = '';
    let lastOutput = '';
    
    for (let i = 0; i < scenes.length - 1; i++) {
      const inputA = i === 0 ? `[v${i}]` : lastOutput;
      const inputB = `[v${i + 1}]`;
      const outputLabel = `[t${i}]`;
      lastOutput = outputLabel;
      
      let transitionFilter = '';
      const transitionDuration = 1; // 1 second transition
      
      switch (transition) {
        case 'fade':
          transitionFilter = `${inputA}${inputB}xfade=transition=fade:duration=${transitionDuration}:offset=${duration - transitionDuration}${outputLabel};`;
          break;
        case 'wipe':
          transitionFilter = `${inputA}${inputB}xfade=transition=wiperight:duration=${transitionDuration}:offset=${duration - transitionDuration}${outputLabel};`;
          break;
        case 'slide':
          transitionFilter = `${inputA}${inputB}xfade=transition=slideleft:duration=${transitionDuration}:offset=${duration - transitionDuration}${outputLabel};`;
          break;
      }
      
      transitionFilterComplex += transitionFilter;
    }
    
    filterComplex += transitionFilterComplex;
    
    // Use the last transition output as the final output
    filterComplex += `${lastOutput}`;
  } else {
    // No transitions, just concat all scenes
    filterComplex += `${concatParts}concat=n=${scenes.length}:v=1:a=0[out]`;
  }
  
  // Build the final command
  const command = `-y${inputs} -filter_complex "${filterComplex}" -map "[out]" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p "${outputPath}"`;
  
  return command;
}

/**
 * Generates a thumbnail for a video
 * @param videoUri URI of the video
 * @returns Promise resolving to the local URI of the generated thumbnail
 */
export async function generateVideoThumbnail(videoUri: string): Promise<string> {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: 0,
      quality: 0.8,
    });
    return uri;
  } catch (error) {
    console.error('Error generating video thumbnail:', error);
    throw error;
  }
}