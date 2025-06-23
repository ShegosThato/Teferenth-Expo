export const colors = {
  primary: '#7c3aed', // indigo-600
  background: '#f9fafb',
  card: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  mutedText: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
  danger: '#ef4444',
};

export const statusColors: Record<string, string> = {
  draft: colors.mutedText,
  storyboard: colors.info,
  rendering: colors.warning,
  completed: colors.success,
};