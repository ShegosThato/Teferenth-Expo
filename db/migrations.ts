// db/migrations.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '@nozbe/watermelondb';
import { Project } from './models';

interface LegacyProject {
  id: string;
  title: string;
  sourceText: string;
  style: string;
  scenes: Array<{
    id: string;
    text: string;
    image?: string;
    imagePrompt?: string;
  }>;
  status: string;
  progress: number;
  videoUrl?: string;
  createdAt: number;
}

interface LegacyStore {
  projects: LegacyProject[];
  // ... other legacy store properties
}

export async function migrateLegacyData(database: Database): Promise<void> {
  try {
    console.log('Checking for legacy data migration...');
    
    // Check if migration has already been done
    const migrationKey = 'watermelondb_migration_completed';
    const migrationCompleted = await AsyncStorage.getItem(migrationKey);
    
    if (migrationCompleted === 'true') {
      console.log('Migration already completed, skipping...');
      return;
    }

    // Try to get legacy data from AsyncStorage
    const legacyDataKey = 'tefereth-store'; // This should match your Zustand persist key
    const legacyDataString = await AsyncStorage.getItem(legacyDataKey);
    
    if (!legacyDataString) {
      console.log('No legacy data found, marking migration as complete');
      await AsyncStorage.setItem(migrationKey, 'true');
      return;
    }

    const legacyData: { state: LegacyStore } = JSON.parse(legacyDataString);
    const legacyProjects = legacyData.state?.projects || [];

    if (legacyProjects.length === 0) {
      console.log('No legacy projects to migrate');
      await AsyncStorage.setItem(migrationKey, 'true');
      return;
    }

    console.log(`Migrating ${legacyProjects.length} legacy projects...`);

    // Migrate projects to WatermelonDB
    await database.write(async () => {
      for (const legacyProject of legacyProjects) {
        // Create the project
        const project = await database.get<Project>('projects').create(p => {
          p.title = legacyProject.title;
          p.sourceText = legacyProject.sourceText;
          p.style = legacyProject.style;
          p.status = legacyProject.status;
          p.progress = legacyProject.progress;
          p.videoUrl = legacyProject.videoUrl;
          p.version = 1;
          // Note: createdAt and updatedAt are automatically set by WatermelonDB
        });

        // Create the scenes
        for (const legacyScene of legacyProject.scenes) {
          await database.get('scenes').create(scene => {
            scene.project.set(project);
            scene.text = legacyScene.text;
            scene.image = legacyScene.image;
            scene.imagePrompt = legacyScene.imagePrompt;
          });
        }
      }
    });

    // Mark migration as completed
    await AsyncStorage.setItem(migrationKey, 'true');
    
    console.log(`Successfully migrated ${legacyProjects.length} projects to WatermelonDB`);
    
    // Optionally, remove the legacy data to free up space
    // await AsyncStorage.removeItem(legacyDataKey);
    
  } catch (error) {
    console.error('Error during legacy data migration:', error);
    // Don't throw the error to prevent app crashes
    // The app should still work without the legacy data
  }
}