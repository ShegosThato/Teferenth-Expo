/**
 * SyncIndicator Component
 * 
 * A reusable component that displays sync status with customizable appearance.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

export interface SyncIndicatorProps {
  isSyncing: boolean;
  pendingActions: number;
  showPendingCount?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  color?: string;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  isSyncing,
  pendingActions,
  showPendingCount = true,
  onPress,
  variant = 'default',
  color = colors.primary,
}) => {
  const getStatusText = () => {
    if (isSyncing) {
      return 'Syncing...';
    }
    
    if (pendingActions > 0 && showPendingCount) {
      return `${pendingActions} pending ${pendingActions === 1 ? 'action' : 'actions'}`;
    }
    
    return 'Synced';
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return 'sync';
    }
    
    if (pendingActions > 0) {
      return 'cloud-upload-outline';
    }
    
    return 'checkmark-circle';
  };

  const getIndicatorStyle = () => {
    switch (variant) {
      case 'compact':
        return [styles.indicator, styles.compact, { backgroundColor: color }];
      case 'detailed':
        return [styles.indicator, styles.detailed, { backgroundColor: color }];
      default:
        return [styles.indicator, { backgroundColor: color }];
    }
  };

  const Component = onPress ? Pressable : View;

  return (
    <Component
      style={getIndicatorStyle()}
      onPress={onPress}
      android_ripple={onPress ? { color: 'rgba(255,255,255,0.2)' } : undefined}
    >
      <View style={styles.content}>
        <Ionicons
          name={getStatusIcon()}
          size={variant === 'compact' ? 12 : 14}
          color="white"
          style={[
            styles.icon,
            isSyncing && styles.spinningIcon,
          ]}
        />
        
        {variant !== 'compact' && (
          <Text style={[
            styles.text,
            variant === 'detailed' && styles.detailedText,
          ]}>
            {getStatusText()}
          </Text>
        )}
        
        {variant === 'detailed' && pendingActions > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingActions}</Text>
          </View>
        )}
      </View>
    </Component>
  );
};

const styles = StyleSheet.create({
  indicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailed: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  spinningIcon: {
    // Animation would be handled by the parent component
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  detailedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});