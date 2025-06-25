// db/index.ts
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { mySchema } from './schema';
import { Project, Scene, ActionQueue } from './models';

// Create the adapter
const adapter = new SQLiteAdapter({
  schema: mySchema,
  // For Expo/React Native
  jsi: false, // Set to false for Expo
  dbName: 'tefereth', // Database name
  // (Optional) onSetUpError: error => { /* handle setup error */ },
});

// Create the database instance
export const database = new Database({
  adapter,
  modelClasses: [Project, Scene, ActionQueue],
});

export * from './models';
export * from './actions';
export { mySchema } from './schema';