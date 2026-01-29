import { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Pdf from 'react-native-pdf';

import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@/components/nativewindui/Icon';
import { Pressable } from 'react-native';

/**
 * Ensure path has file:// prefix for react-native-pdf
 */
const ensureFileUri = (path: string): string => {
  if (path.startsWith('file://')) return path;
  return `file://${path}`;
};

export default function PDFViewerScreen() {
  const params = useLocalSearchParams<{ filePath: string; fileName: string }>();
  const router = useRouter();

  const pdfSource = useMemo(
    () => ({ uri: ensureFileUri(params.filePath ?? '') }),
    [params.filePath]
  );

  const handleClose = () => {
    router.back();
  };

  if (!params.filePath) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Icon name="exclamationmark.triangle" size={48} className="text-destructive" />
        <Text variant="body" color="tertiary" className="mt-2">
          No file path provided
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: params.fileName ?? 'PDF',
          headerLeft: () => null,
          headerRight: () => (
            <Pressable
              onPress={handleClose}
              className="p-2"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="xmark" size={24} className="text-primary" />
            </Pressable>
          ),
        }}
      />
      <View style={styles.container}>
        <Pdf
          source={pdfSource}
          style={styles.pdf}
          onLoadComplete={(numberOfPages) => {
            console.log('[PDFViewer] Loaded PDF with', numberOfPages, 'pages');
          }}
          onError={(error) => {
            console.error('[PDFViewer] Error loading PDF:', error);
          }}
          trustAllCerts={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
