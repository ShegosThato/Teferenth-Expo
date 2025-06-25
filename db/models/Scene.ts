// db/models/Scene.ts
import { Model } from '@nozbe/watermelondb';
import { field, text, relation, readonly, date, writer } from '@nozbe/watermelondb/decorators';
import { Project } from './Project';

export class Scene extends Model {
  static table = 'scenes';
  static associations = {
    // This defines the other side of the relationship.
    projects: { type: 'belongs_to', key: 'project_id' },
  };

  @text('text') text!: string;
  @field('image') image?: string; // This will store the local file URI
  @text('image_prompt') imagePrompt?: string;
  @field('duration') duration?: number;
  @readonly @date('created_at') createdAt!: Date;
  
  // `@relation` defines the 'belongs_to' relationship.
  // It allows you to access the parent Project model via `scene.project`.
  @relation('projects', 'project_id') project!: Project;

  @writer async setImage(imageUri: string): Promise<void> {
    await this.update(() => {
      this.image = imageUri;
    });
  }

  @writer async setDuration(duration: number): Promise<void> {
    await this.update(() => {
      this.duration = duration;
    });
  }
}