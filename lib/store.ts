import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Scene {
  id: string;
  text: string;
  image?: string; // URL to generated image
  imagePrompt?: string; // prompt for image generation (optional)
}

export interface Project {
  id: string;
  title: string;
  sourceText: string;
  style: string;
  scenes: Scene[];
  status: 'draft' | 'storyboard' | 'rendering' | 'completed';
  progress: number; // 0..1
  videoUrl?: string;
  createdAt: number; // timestamp
}

interface StoreState {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, partial: Partial<Project>) => void;
  removeProject: (id: string) => void;
}

// TODO: Add middleware for debugging and logging
// NOTE: Consider splitting store if it grows larger
export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      projects: [],
      addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
      updateProject: (id, partial) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...partial } : p)),
        })),
      removeProject: (id) => set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),
    }),
    {
      name: 'tefereth-projects-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the projects array
      partialize: (state) => ({ projects: state.projects }),
    }
  )
);