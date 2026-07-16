import { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { getToken } from './src/api/client';
import { COLORS } from './src/theme/colors';

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator color={COLORS.brass} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {loggedIn ? <RootNavigator /> : <LoginScreen onLoggedIn={handleLoggedIn} />}
    </NavigationContainer>
  );
}
