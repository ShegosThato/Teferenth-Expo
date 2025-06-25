// db/models/ActionQueue.ts
import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date, writer } from '@nozbe/watermelondb/decorators';

export type ActionType = 'GENERATE_SCENES' | 'GENERATE_IMAGE' | 'GENERATE_VIDEO';
export type ActionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ActionPayload {
  projectId?: string;
  sceneId?: string;
  [key: string]: any;
}

export class ActionQueue extends Model {
  static table = 'action_queue';

  @text('type') type!: ActionType;
  @text('payload') payload!: string; // JSON string
  @field('last_error') lastError?: string;
  @field('retry_count') retryCount!: number;
  @field('status') status!: ActionStatus;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Helper methods to work with payload
  getPayload(): ActionPayload {
    try {
      return JSON.parse(this.payload);
    } catch {
      return {};
    }
  }

  @writer async setPayload(payload: ActionPayload): Promise<void> {
    await this.update(() => {
      this.payload = JSON.stringify(payload);
    });
  }

  @writer async updateStatus(status: ActionStatus, error?: string): Promise<void> {
    await this.update(() => {
      this.status = status;
      if (error) {
        this.lastError = error;
      }
    });
  }

  @writer async incrementRetry(): Promise<void> {
    await this.update(() => {
      this.retryCount = this.retryCount + 1;
    });
  }
}