import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { AuthProvider, useAuth } from '@/lib/auth-context';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { session, allBusinessUsers, currentBusinessUser, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)';
    const inWelcome = segments[0] === 'welcome';
    const inNewUserRole = segments[0] === 'new-user-role';
    const inBusinessSelect = segments[0] === 'business-select';
    const inBootstrap = segments[0] === 'bootstrap';
    const inCashierInvite = segments[0] === 'cashier-invite';

    if (!session) {
      // Not authenticated → show welcome screen
      if (!inWelcome && !inAuth && !inNewUserRole) {
        router.replace('/welcome');
      }
    } else {
      // Authenticated
      if (allBusinessUsers.length === 0) {
        // New user going through onboarding (bootstrap or cashier-invite)
        // Don't redirect, they're already in the right flow
      } else if (allBusinessUsers.length === 1) {
        // Single business → go directly to app
        if (!currentBusinessUser) {
          // This shouldn't happen, but safety check
          return;
        }
        if (inAuth || inWelcome || inBusinessSelect || inNewUserRole || inBootstrap || inCashierInvite) {
          router.replace('/(app)/(home)');
        }
      } else {
        // Multiple businesses
        if (!currentBusinessUser && !inBusinessSelect) {
          // No business selected → show selector
          router.replace('/business-select');
        } else if (currentBusinessUser && (inAuth || inWelcome || inNewUserRole || inBootstrap || inCashierInvite)) {
          // Business selected and in auth screens → go to app
          router.replace('/(app)/(home)');
        }
      }
    }
  }, [session, allBusinessUsers, currentBusinessUser, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AuthGate />
    </AuthProvider>
  );
}
