import { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { File } from 'expo-file-system';
import Pdf from 'react-native-pdf';

import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@/components/nativewindui/Icon';
import { getCacheFilePath } from '@/lib/files';

export default function PDFViewerScreen() {
  const params = useLocalSearchParams<{ fileName: string }>();
  const router = useRouter();

  const pdfSource = useMemo(() => {
    const fullPath = getCacheFilePath(params.fileName ?? '');
    const nativePath = fullPath.replace(/^file:\/\//, '');
    return { uri: nativePath };
  }, [params.fileName]);

  const handleClose = () => {
    router.back();
  };

  if (!params.fileName) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Icon name={"exclamationmark"} size={48} className="text-destructive" />
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
          onLoadComplete={(_, path) => {
            const name = new File(path).name;
            console.log('[PDF Viewer] PDF file', name ?? "undefined", 'was loaded.');
          }}
          onError={(error) => {
            console.error('[PDF Viewer] Error loading PDF:', {
              error, pdfSource
            });
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
