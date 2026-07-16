import { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { getToken } from './src/api/client';
import { COLORS } from './src/theme/colors';
import { GymDataProvider } from './src/context/GymDataContext';

export default function App() {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      setLoggedIn(!!token);
      setChecking(false);
    })();
  }, []);

  const handleLoggedIn = useCallback(() => setLoggedIn(true), []);

  if (checking) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
          <ActivityIndicator color={COLORS.brass} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        {loggedIn ? (
          <GymDataProvider>
            <RootNavigator />
          </GymDataProvider>
        ) : (
          <LoginScreen onLoggedIn={handleLoggedIn} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
