import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { useDownloadMessageAttachmentsContext } from '@/contexts/downloadMessageAttachments';
import { useTotalFiles, useCurrentFile, useRemainingFiles } from '@/stores/downloadProgress';
import { CircularProgress } from './CircularProgress';

export function DownloadProgressOverlay() {
  const { isProcessing } = useDownloadMessageAttachmentsContext();
  const totalFiles = useTotalFiles();
  const currentFile = useCurrentFile();
  const remainingFiles = useRemainingFiles();
  const [isMinimized, setIsMinimized] = useState(true);

  if (!isProcessing) {
    // Reset to minimized state when downloads complete
    if (!isMinimized) {
      setIsMinimized(true);
    }
    return null;
  }

  // Show minimized indicator in bottom-right corner by default
  if (isMinimized) {
    const progress = totalFiles > 0 ? currentFile / totalFiles : 0;
    
    return (
      <Pressable 
        style={styles.minimizedContainer}
        onPress={() => setIsMinimized(false)}
      >
        <View style={styles.minimizedIndicator}>
          <CircularProgress 
            size={56}
            strokeWidth={4}
            progress={progress}
            color="#007AFF"
            backgroundColor="#e0e0e0"
          />
          <View style={styles.minimizedTextContainer}>
            <Text style={styles.minimizedNumber}>{currentFile}</Text>
            <Text style={styles.minimizedTotal}>/{totalFiles}</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  const progress = totalFiles > 0 ? currentFile / totalFiles : 0;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.text}>Downloading files...</Text>
          <Pressable 
            onPress={() => setIsMinimized(true)}
            hitSlop={8}
          >
            <Text style={styles.minimizeButton}>−</Text>
          </Pressable>
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.circularProgressWrapper}>
            <CircularProgress 
              size={100}
              strokeWidth={6}
              progress={progress}
              color="#007AFF"
              backgroundColor="#e0e0e0"
            />
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressNumber}>{currentFile}</Text>
              <Text style={styles.progressTotal}>/{totalFiles}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.remainingInfo}>
          {remainingFiles} remaining
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  circularProgressWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTextContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  progressTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  remainingInfo: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  minimizeButton: {
    fontSize: 24,
    fontWeight: '700',
    color: '#666',
    paddingHorizontal: 8,
  },
  minimizedContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  minimizedIndicator: {
    backgroundColor: 'white',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  minimizedTextContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  minimizedNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  minimizedTotal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
});
