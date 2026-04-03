import { useCallback } from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/lib/theme';

export default function CaptureScreen() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      launchCamera();
    }, [])
  );

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
    } else {
      router.back();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={styles.cancelText}>Cancelar</Text>
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
});
