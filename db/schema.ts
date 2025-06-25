// db/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
  version: 1, // Increment this version number when you make schema changes
  tables: [
    tableSchema({
      name: 'projects',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'source_text', type: 'string' },
        { name: 'style', type: 'string' },
        { name: 'status', type: 'string', isIndexed: true }, // Indexed for faster queries
        { name: 'progress', type: 'number' },
        { name: 'video_url', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'scenes',
      columns: [
        { name: 'text', type: 'string' },
        { name: 'image', type: 'string', isOptional: true }, // Local file URI for the image
        { name: 'image_prompt', type: 'string', isOptional: true },
        { name: 'project_id', type: 'string', isIndexed: true }, // Foreign key to projects table
        { name: 'duration', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'action_queue',
      columns: [
        { name: 'type', type: 'string', isIndexed: true }, // e.g., 'GENERATE_SCENES', 'GENERATE_IMAGE'
        { name: 'payload', type: 'string' }, // JSON string of required data, e.g., { projectId: '...' }
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'retry_count', type: 'number' },
        { name: 'status', type: 'string', isIndexed: true }, // 'pending', 'processing', 'completed', 'failed'
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});