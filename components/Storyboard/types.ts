/**
 * Storyboard Component Types
 */

import { Project, Scene } from '../../types';

export interface StoryboardHeaderProps {
  project: Project;
  onBack: () => void;
  onShare?: () => void;
}

export interface SceneListProps {
  scenes: Scene[];
  isLoading: boolean;
  onScenePress?: (scene: Scene) => void;
  onRegenerateImage?: (scene: Scene) => void;
}

export interface SceneCardProps {
  scene: Scene;
  index: number;
  onPress?: () => void;
  onRegenerateImage?: () => void;
  isLoading?: boolean;
}

export interface VideoControlsProps {
  project: Project;
  onGenerateVideo: () => void;
  onPlayVideo?: () => void;
  isGenerating: boolean;
  hasVideo: boolean;
}

export interface StoryboardActionsProps {
  project: Project;
  scenes: Scene[];
  onGenerateScenes: () => void;
  onGenerateImages: () => void;
  onGenerateVideo: () => void;
  isLoading: boolean;
}