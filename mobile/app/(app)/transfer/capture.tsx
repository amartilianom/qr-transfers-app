import { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/lib/theme';

export default function CaptureScreen() {
  const router = useRouter();
  const launched = useRef(false);

  useEffect(() => {
    if (launched.current) return;
    launched.current = true;
    launchCamera();
  }, []);

  async function launchCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      router.replace({
        pathname: '/(app)/transfer/confirm',
        params: { imageUri: result.assets[0].uri },
      });
    }
  }

  async function pickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      router.replace({
        pathname: '/(app)/transfer/confirm',
        params: { imageUri: result.assets[0].uri },
      });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Cancel */}
      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </TouchableOpacity>

      {/* Gallery icon — bottom left */}
      <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery} activeOpacity={0.7}>
        <Text style={styles.galleryIcon}>🖼️</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cancelButton: {
    position: 'absolute',
    top: 56,
    left: 20,
    padding: 8,
  },
  cancelText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#fff',
  },
  galleryButton: {
    position: 'absolute',
    bottom: 48,
    left: 32,
    padding: 8,
  },
  galleryIcon: {
    fontSize: 32,
  },
});
