import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Camera, TrendingUp, Calendar as CalendarIcon, ListChecks } from 'lucide-react-native';
import RegistrarScreen from '../screens/RegistrarScreen';
import HistorialScreen from '../screens/HistorialScreen';
import CalendarioScreen from '../screens/CalendarioScreen';
import RutinasScreen from '../screens/RutinasScreen';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();

// Las 4 pestañas de la app original (ver App.jsx del proyecto web: registrar, historial,
// calendario, rutinas), ahora como bottom tabs nativos.
export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.line },
        tabBarActiveTintColor: COLORS.hazard,
        tabBarInactiveTintColor: COLORS.chalkDim,
      }}
    >
      <Tab.Screen
        name="Registrar"
        component={RegistrarScreen}
        options={{ tabBarIcon: ({ color, size }) => <Camera color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Historial"
        component={HistorialScreen}
        options={{ tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Calendario"
        component={CalendarioScreen}
        options={{ tabBarIcon: ({ color, size }) => <CalendarIcon color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Rutinas"
        component={RutinasScreen}
        options={{ tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
