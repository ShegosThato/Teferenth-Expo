// components/VideoPlayer.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Modal, Pressable, Text, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';

interface VideoPlayerProps {
  uri: string;
  thumbnail?: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ uri, thumbnail, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const video = React.useRef(null);

  const handlePlaybackStatusUpdate = (status) => {
    setIsPlaying(status.isPlaying);
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.videoContainer}>
          <Video
            ref={video}
            style={styles.video}
            source={{ uri }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            posterSource={thumbnail ? { uri: thumbnail } : undefined}
            posterStyle={styles.poster}
            usePoster={!!thumbnail}
          />
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close-circle" size={32} color="white" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: width * 0.9,
    height: height * 0.5,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  poster: {
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
  },
});