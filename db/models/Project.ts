// db/models/Project.ts
import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date, children, writer } from '@nozbe/watermelondb/decorators';
import { Scene } from './Scene';

export class Project extends Model {
  static table = 'projects';
  static associations = {
    scenes: { type: 'has_many', foreignKey: 'project_id' },
  };

  @text('title') title!: string;
  @text('source_text') sourceText!: string;
  @text('style') style!: string;
  @field('status') status!: string;
  @field('progress') progress!: number;
  @field('video_url') videoUrl?: string;
  @field('version') version!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('scenes') scenes!: Scene[];

  @writer async addScene(text: string, imagePrompt?: string): Promise<Scene> {
    const newScene = await this.collections.get<Scene>('scenes').create(scene => {
      scene.project.set(this); // `this` refers to the Project instance
      scene.text = text;
      if (imagePrompt) {
        scene.imagePrompt = imagePrompt;
      }
    });
    return newScene;
  }

  @writer async updateStatus(status: string, progress?: number): Promise<void> {
    await this.update(() => {
      this.status = status;
      if (progress !== undefined) {
        this.progress = progress;
      }
    });
  }

  @writer async setVideoUrl(url: string): Promise<void> {
    await this.update(() => {
      this.videoUrl = url;
    });
  }
}