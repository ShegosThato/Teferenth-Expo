/**
 * Optimized Video Generator with Memory Management
 * 
 * Enhanced video generation with memory optimization, progress tracking,
 * and resource cleanup for better performance on mobile devices.
 * 
 * Phase 2: Performance Optimization - Video Generation Memory Usage
 */

import { FFmpegKit, FFmpegKitConfig, ReturnCode } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Platform } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import { Project, Scene } from '../db/models';
import { toast } from './toast';
import { handleError } from './errorHandling';
import { memoryManager } from './memoryManagement';
import { performanceMonitor } from './performance';

interface OptimizedVideoGenerationOptions {
  duration?: number;
  transition?: 'fade' | 'wipe' | 'slide' | 'none';
  resolution?: '720p' | '1080p' | '480p'; // Added 480p for memory optimization
  textPosition?: 'bottom' | 'top' | 'none';
  textColor?: string;
  backgroundColor?: string;
  quality?: 'low' | 'medium' | 'high';
  maxMemoryUsage?: number; // MB
  chunkSize?: number; // Number of scenes to process at once
  onProgress?: (progress: number) => void;
  onMemoryWarning?: (usage: number) => void;
}

interface VideoGenerationState {
  isGenerating: boolean;
  currentChunk: number;
  totalChunks: number;
  processedScenes: number;
  totalScenes: number;
  memoryUsage: number;
  tempFiles: string[];
}

const DEFAULT_OPTIMIZED_OPTIONS: OptimizedVideoGenerationOptions = {
  duration: 5,
  transition: 'fade',
  resolution: '720p',
  textPosition: 'bottom',
  textColor: 'white',
  backgroundColor: 'black',
  quality: 'medium',
  maxMemoryUsage: 100, // 100MB max
  chunkSize: 3, // Process 3 scenes at a time
};

class OptimizedVideoGenerator {
  private state: VideoGenerationState = {
    isGenerating: false,
    currentChunk: 0,
    totalChunks: 0,
    processedScenes: 0,
    totalScenes: 0,
    memoryUsage: 0,
    tempFiles: [],
  };

  private cleanupTasks: Array<() => Promise<void>> = [];

  async generateVideo(
    database: Database,
    projectId: string,
    options: OptimizedVideoGenerationOptions = {}
  ): Promise<string> {
    const opts = { ...DEFAULT_OPTIMIZED_OPTIONS, ...options };
    
    try {
      this.state.isGenerating = true;
      performanceMonitor.startTimer('video_generation');
      
      // Check initial memory usage
      await this.checkMemoryUsage(opts);
      
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permissions not granted');
      }

      // Get project and scenes
      const project = await database.get<Project>('projects').find(projectId);
      const scenes = await project.scenes.fetch();

      if (scenes.length === 0) {
        throw new Error('No scenes found in project');
      }

      this.state.totalScenes = scenes.length;
      this.state.totalChunks = Math.ceil(scenes.length / opts.chunkSize!);

      // Process scenes in chunks to manage memory
      const videoSegments: string[] = [];
      
      for (let i = 0; i < scenes.length; i += opts.chunkSize!) {
        this.state.currentChunk = Math.floor(i / opts.chunkSize!) + 1;
        
        const chunk = scenes.slice(i, i + opts.chunkSize!);
        const segmentPath = await this.processSceneChunk(chunk, opts, i);
        
        videoSegments.push(segmentPath);
        this.addTempFile(segmentPath);
        
        // Check memory usage after each chunk
        await this.checkMemoryUsage(opts);
        
        // Update progress
        this.state.processedScenes = Math.min(i + opts.chunkSize!, scenes.length);
        const progress = this.state.processedScenes / this.state.totalScenes;
        opts.onProgress?.(progress * 0.8); // Reserve 20% for final concatenation
        
        // Cleanup intermediate files if memory is getting high
        if (this.state.memoryUsage > opts.maxMemoryUsage! * 0.8) {
          await this.performIntermediateCleanup();
        }
      }

      // Concatenate all segments
      const finalVideoPath = await this.concatenateSegments(videoSegments, opts);
      
      // Final cleanup
      await this.cleanup();
      
      opts.onProgress?.(1.0);
      performanceMonitor.endTimer('video_generation');
      
      return finalVideoPath;

    } catch (error) {
      await this.cleanup();
      this.state.isGenerating = false;
      throw error;
    }
  }

  private async processSceneChunk(
    scenes: Scene[],
    options: OptimizedVideoGenerationOptions,
    chunkIndex: number
  ): Promise<string> {
    const tempDir = `${FileSystem.cacheDirectory}video_generation/chunk_${chunkIndex}/`;
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    
    const segmentPaths: string[] = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const scenePath = await this.processScene(scene, options, tempDir, i);
      segmentPaths.push(scenePath);
      this.addTempFile(scenePath);
    }
    
    // Concatenate scenes in this chunk
    const chunkOutputPath = `${tempDir}chunk_${chunkIndex}.mp4`;
    await this.concatenateScenes(segmentPaths, chunkOutputPath, options);
    
    // Clean up individual scene files to save memory
    await this.cleanupFiles(segmentPaths);
    
    return chunkOutputPath;
  }

  private async processScene(
    scene: Scene,
    options: OptimizedVideoGenerationOptions,
    tempDir: string,
    sceneIndex: number
  ): Promise<string> {
    const outputPath = `${tempDir}scene_${sceneIndex}.mp4`;
    
    // Get resolution settings based on quality and memory constraints
    const { width, height, bitrate } = this.getOptimalVideoSettings(options);
    
    // Create video from scene
    if (scene.imageUrl) {
      await this.createVideoFromImage(scene, outputPath, options, width, height, bitrate);
    } else {
      await this.createVideoFromText(scene, outputPath, options, width, height, bitrate);
    }
    
    return outputPath;
  }

  private getOptimalVideoSettings(options: OptimizedVideoGenerationOptions) {
    const memoryUsage = this.state.memoryUsage;
    const maxMemory = options.maxMemoryUsage!;
    
    // Adjust quality based on memory usage
    let resolution = options.resolution!;
    let quality = options.quality!;
    
    if (memoryUsage > maxMemory * 0.7) {
      // High memory usage - reduce quality
      if (resolution === '1080p') resolution = '720p';
      else if (resolution === '720p') resolution = '480p';
      
      if (quality === 'high') quality = 'medium';
      else if (quality === 'medium') quality = 'low';
    }
    
    const settings = {
      '1080p': { width: 1920, height: 1080, bitrate: quality === 'high' ? '5000k' : quality === 'medium' ? '3000k' : '1500k' },
      '720p': { width: 1280, height: 720, bitrate: quality === 'high' ? '2500k' : quality === 'medium' ? '1500k' : '800k' },
      '480p': { width: 854, height: 480, bitrate: quality === 'high' ? '1000k' : quality === 'medium' ? '600k' : '400k' },
    };
    
    return settings[resolution as keyof typeof settings];
  }

  private async createVideoFromImage(
    scene: Scene,
    outputPath: string,
    options: OptimizedVideoGenerationOptions,
    width: number,
    height: number,
    bitrate: string
  ): Promise<void> {
    const duration = options.duration!;
    
    // Optimize image before processing
    const optimizedImagePath = await this.optimizeImage(scene.imageUrl!, width, height);
    this.addTempFile(optimizedImagePath);
    
    let command = `-loop 1 -i "${optimizedImagePath}" -t ${duration} -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -b:v ${bitrate} -pix_fmt yuv420p -movflags +faststart "${outputPath}"`;
    
    // Add text overlay if needed
    if (options.textPosition !== 'none' && scene.description) {
      const textFilter = this.createTextFilter(scene.description, options, width, height);
      command = command.replace('-vf "', `-vf "${textFilter},`);
    }
    
    await this.executeFFmpegCommand(command);
  }

  private async createVideoFromText(
    scene: Scene,
    outputPath: string,
    options: OptimizedVideoGenerationOptions,
    width: number,
    height: number,
    bitrate: string
  ): Promise<void> {
    const duration = options.duration!;
    const backgroundColor = options.backgroundColor!;
    
    // Create solid color background with text
    const textFilter = this.createTextFilter(scene.description, options, width, height);
    
    const command = `-f lavfi -i "color=${backgroundColor}:size=${width}x${height}:duration=${duration}" -vf "${textFilter}" -c:v libx264 -b:v ${bitrate} -pix_fmt yuv420p -movflags +faststart "${outputPath}"`;
    
    await this.executeFFmpegCommand(command);
  }

  private async optimizeImage(imagePath: string, targetWidth: number, targetHeight: number): Promise<string> {
    const optimizedPath = `${FileSystem.cacheDirectory}optimized_${Date.now()}.jpg`;
    
    // Resize and compress image to reduce memory usage
    const command = `-i "${imagePath}" -vf "scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease" -q:v 3 "${optimizedPath}"`;
    
    await this.executeFFmpegCommand(command);
    return optimizedPath;
  }

  private createTextFilter(text: string, options: OptimizedVideoGenerationOptions, width: number, height: number): string {
    const fontSize = Math.max(16, Math.floor(height / 20)); // Responsive font size
    const textColor = options.textColor!;
    const position = options.textPosition!;
    
    let y = position === 'top' ? 'h*0.1' : 'h*0.85';
    
    return `drawtext=text='${text.replace(/'/g, "\\'")}':fontcolor=${textColor}:fontsize=${fontSize}:x=(w-text_w)/2:y=${y}:box=1:boxcolor=black@0.5:boxborderw=5`;
  }

  private async concatenateScenes(inputPaths: string[], outputPath: string, options: OptimizedVideoGenerationOptions): Promise<void> {
    if (inputPaths.length === 1) {
      // Just copy the file if there's only one
      await FileSystem.copyAsync({ from: inputPaths[0], to: outputPath });
      return;
    }
    
    // Create concat file
    const concatFilePath = `${FileSystem.cacheDirectory}concat_${Date.now()}.txt`;
    const concatContent = inputPaths.map(path => `file '${path}'`).join('\n');
    await FileSystem.writeAsStringAsync(concatFilePath, concatContent);
    this.addTempFile(concatFilePath);
    
    // Add transitions if specified
    let command: string;
    if (options.transition === 'fade') {
      command = await this.createFadeTransitionCommand(inputPaths, outputPath);
    } else {
      command = `-f concat -safe 0 -i "${concatFilePath}" -c copy "${outputPath}"`;
    }
    
    await this.executeFFmpegCommand(command);
  }

  private async concatenateSegments(segmentPaths: string[], options: OptimizedVideoGenerationOptions): Promise<string> {
    const finalOutputPath = `${FileSystem.documentDirectory}generated_video_${Date.now()}.mp4`;
    await this.concatenateScenes(segmentPaths, finalOutputPath, options);
    return finalOutputPath;
  }

  private async createFadeTransitionCommand(inputPaths: string[], outputPath: string): Promise<string> {
    // Simplified fade transition for memory efficiency
    if (inputPaths.length === 2) {
      return `-i "${inputPaths[0]}" -i "${inputPaths[1]}" -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=4.5[v]" -map "[v]" "${outputPath}"`;
    } else {
      // For multiple files, use simple concatenation to avoid memory issues
      const concatFilePath = `${FileSystem.cacheDirectory}concat_${Date.now()}.txt`;
      const concatContent = inputPaths.map(path => `file '${path}'`).join('\n');
      await FileSystem.writeAsStringAsync(concatFilePath, concatContent);
      this.addTempFile(concatFilePath);
      
      return `-f concat -safe 0 -i "${concatFilePath}" -c copy "${outputPath}"`;
    }
  }

  private async executeFFmpegCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      FFmpegKit.execute(command).then(async (session) => {
        const returnCode = await session.getReturnCode();
        
        if (ReturnCode.isSuccess(returnCode)) {
          resolve();
        } else {
          const logs = await session.getLogs();
          const errorMessage = logs.map(log => log.getMessage()).join('\n');
          reject(new Error(`FFmpeg failed: ${errorMessage}`));
        }
      }).catch(reject);
    });
  }

  private async checkMemoryUsage(options: OptimizedVideoGenerationOptions): Promise<void> {
    // Estimate memory usage (this would be more accurate with native modules)
    const estimatedUsage = this.state.tempFiles.length * 10; // Rough estimate: 10MB per temp file
    this.state.memoryUsage = estimatedUsage;
    
    if (estimatedUsage > options.maxMemoryUsage!) {
      options.onMemoryWarning?.(estimatedUsage);
      await this.performIntermediateCleanup();
    }
  }

  private async performIntermediateCleanup(): Promise<void> {
    // Clean up oldest temp files to free memory
    const filesToClean = this.state.tempFiles.splice(0, Math.floor(this.state.tempFiles.length / 2));
    await this.cleanupFiles(filesToClean);
  }

  private addTempFile(filePath: string): void {
    this.state.tempFiles.push(filePath);
  }

  private async cleanupFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(filePath);
        }
      } catch (error) {
        console.warn(`Failed to cleanup file ${filePath}:`, error);
      }
    }
  }

  private async cleanup(): Promise<void> {
    // Clean up all temp files
    await this.cleanupFiles(this.state.tempFiles);
    
    // Run additional cleanup tasks
    for (const task of this.cleanupTasks) {
      try {
        await task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    }
    
    // Reset state
    this.state = {
      isGenerating: false,
      currentChunk: 0,
      totalChunks: 0,
      processedScenes: 0,
      totalScenes: 0,
      memoryUsage: 0,
      tempFiles: [],
    };
    
    this.cleanupTasks = [];
  }

  public addCleanupTask(task: () => Promise<void>): void {
    this.cleanupTasks.push(task);
  }

  public getGenerationState(): VideoGenerationState {
    return { ...this.state };
  }
}

// Singleton instance
export const optimizedVideoGenerator = new OptimizedVideoGenerator();

// Legacy compatibility function
export async function generateOptimizedVideo(
  database: Database,
  projectId: string,
  options: OptimizedVideoGenerationOptions = {}
): Promise<string> {
  return optimizedVideoGenerator.generateVideo(database, projectId, options);
}