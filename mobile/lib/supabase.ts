import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Storage adapter for native (iOS/Android)
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// Storage adapter for web (localStorage)
const LocalStorageAdapter = {
  getItem: async (key: string) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

// Use localhost for web, network IP for mobile
const supabaseUrl = Platform.OS === 'web'
  ? 'http://127.0.0.1:54321'
  : process.env.EXPO_PUBLIC_SUPABASE_URL!;

const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Use appropriate storage adapter based on platform
const storageAdapter = Platform.OS === 'web' ? LocalStorageAdapter : ExpoSecureStoreAdapter;

// NOTE: Once the local Supabase is running, generate typed client with:
// npx supabase gen types typescript --local > types/database.generated.ts
// Then: createClient<Database>(...)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
