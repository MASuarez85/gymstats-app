import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Camera, Dumbbell, Calendar as CalendarIcon, TrendingUp, MessageCircle, ListChecks } from 'lucide-react-native';
import RegistrarScreen from '../screens/RegistrarScreen';
import HistorialScreen from '../screens/HistorialScreen';
import CalendarioScreen from '../screens/CalendarioScreen';
import ProgresoScreen from '../screens/ProgresoScreen';
import ConsultarScreen from '../screens/ConsultarScreen';
import RutinasScreen from '../screens/RutinasScreen';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();

// Las 6 pestañas de la app original (ver App.jsx del proyecto web): registrar,
// historial, calendario, progreso, consultar, rutinas — ahora como bottom tabs nativos.
export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.line },
        tabBarActiveTintColor: COLORS.hazard,
        tabBarInactiveTintColor: COLORS.chalkDim,
        tabBarLabelStyle: { fontSize: 9 },
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
        options={{ tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Calendario"
        component={CalendarioScreen}
        options={{ tabBarIcon: ({ color, size }) => <CalendarIcon color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Progreso"
        component={ProgresoScreen}
        options={{ tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Consultar"
        component={ConsultarScreen}
        options={{ tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Rutinas"
        component={RutinasScreen}
        options={{ tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
