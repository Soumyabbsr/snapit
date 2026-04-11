import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import { AuthProvider } from './src/context/AuthContext';
import { GroupProvider } from './src/context/GroupContext';
import AppNavigator from './src/navigation/AppNavigator';

import UploadQueueManager from './src/services/uploadQueueManager';
import widgetService from './src/services/widgetService';

// Prevent splash from auto-hiding until we're ready
SplashScreen.preventAutoHideAsync().catch(() => {});

// ─── Error Boundary (catches render crashes) ───────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('💥 App Render Crash:', error);
    console.error('💥 Component Stack:', info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>💥 App Crashed During Render</Text>
          <ScrollView style={styles.errorScroll}>
            <Text style={styles.errorText}>
              {this.state.error?.toString()}
            </Text>
          </ScrollView>
          <Text style={styles.errorHint}>
            Check Metro bundler console for full stack trace
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── Main App ──────────────────────────────────────────────────
export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // 1. Mark ready IMMEDIATELY — never block on optional services
    setAppReady(true);

    // 2. Start background services — completely non-blocking
    UploadQueueManager.loadQueue().catch((e) =>
      console.warn('UploadQueue.loadQueue failed:', e.message)
    );
    UploadQueueManager.processQueue().catch((e) =>
      console.warn('UploadQueue.processQueue failed:', e.message)
    );

    // 4. Refresh Android home screen widget (no-op on iOS)
    widgetService.refreshAllWidgets().catch((e) =>
      console.warn('widgetService.refreshAllWidgets failed:', e.message)
    );
  }, []);

  // 5. Hide splash the moment appReady flips
  useEffect(() => {
    if (!appReady) return;

    const hide = async () => {
      try {
        await SplashScreen.hideAsync();
        console.log('✅ SplashScreen hidden successfully');
      } catch (e) {
        console.warn('SplashScreen.hideAsync failed:', e.message);
      }
    };

    hide();

    // Absolute fallback: force-hide after 3 seconds no matter what
    const fallback = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      console.warn('⚠️ SplashScreen force-hidden via timeout fallback');
    }, 3000);

    return () => clearTimeout(fallback);
  }, [appReady]);

  if (!appReady) return null;

  return (
    <ErrorBoundary>
      <View style={styles.root}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor="#0a0a0a" />
          <AuthProvider>
            <GroupProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </GroupProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a0000',
    padding: 20,
    justifyContent: 'center',
  },
  errorTitle: {
    color: '#ff4444',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorScroll: {
    maxHeight: 400,
    backgroundColor: '#2a0000',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ffaaaa',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  errorHint: {
    color: '#ff8888',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
