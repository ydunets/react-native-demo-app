/**
 * Simple Download Progress Toast
 * Self-contained component with pointerEvents="box-none" to allow navigation
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useIsProcessing, useQueueCount, useCompletedCount } from '@/stores/downloadQueue/valtioHooks';
import { useDownloadedCount, useFailedCount } from '@/stores/downloadStats';

export function DownloadToast() {
  const isProcessing = useIsProcessing();
  const queueCount = useQueueCount();
  const completedCount = useCompletedCount();
  const downloadedCount = useDownloadedCount();
  const failedCount = useFailedCount();

  const processed = completedCount + failedCount;
  const total = processed + queueCount;
  const percent = total === 0 ? 0 : Math.round((processed / total) * 100);

  // Don't render anything if not processing
  if (!isProcessing) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.toast} pointerEvents="auto">
        <View style={styles.header}>
          <Text style={styles.title}>Downloading attachments</Text>
          <Text style={styles.progress}>{processed}/{total} · {percent}%</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>

        <View style={styles.stats}>
          <Text style={styles.stat}>In queue {queueCount}</Text>
          <Text style={styles.stat}>Downloaded {downloadedCount}</Text>
          <Text style={styles.stat}>Failed {failedCount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  progress: {
    fontSize: 13,
    color: '#666',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e5e5',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  stat: {
    fontSize: 12,
    color: '#999',
  },
});
