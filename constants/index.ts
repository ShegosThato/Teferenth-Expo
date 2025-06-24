// TODO: Move all hardcoded values from components to this constants file
// NOTE: This file should be the single source of truth for app constants

// COMPLETED: API endpoints moved to environment configuration (config/env.ts)
// Use API_URLS from config/env.ts instead of these constants

export const FILE_LIMITS = {
  // TODO: Make these configurable based on user tier or device capabilities
  MAX_FILE_SIZE: 1024 * 1024, // 1MB
  MAX_CONTENT_LENGTH: 50000, // 50k characters
  SUPPORTED_TEXT_TYPES: [
    'text/plain',
    'text/markdown',
  ],
  SUPPORTED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

export const VALIDATION_RULES = {
  // TODO: Consider making these user-configurable
  PROJECT_TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  STORY_CONTENT: {
    MIN_LENGTH: 50,
    MAX_LENGTH: 50000,
  },
};

export const TIMEOUTS = {
  // TODO: Make these configurable based on network conditions
  AI_GENERATION: 30000, // 30 seconds
  IMAGE_GENERATION: 45000, // 45 seconds
};

export const UI_CONSTANTS = {
  // TODO: Add more UI constants as needed
  SCENE_CARD_SPACING: 16,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
};

// TODO: Add more constant categories as the app grows:
// - STORAGE_KEYS for AsyncStorage
// - ERROR_MESSAGES for consistent error handling
// - ANALYTICS_EVENTS for tracking
// - FEATURE_FLAGS for A/B testing