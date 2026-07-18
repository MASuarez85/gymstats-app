import { useState } from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Camera, Dumbbell, Calendar as CalendarIcon, TrendingUp, MessageCircle, ListChecks, Lock } from 'lucide-react-native';
import RegistrarScreen from '../screens/RegistrarScreen';
import HistorialScreen from '../screens/HistorialScreen';
import CalendarioScreen from '../screens/CalendarioScreen';
import ProgresoScreen from '../screens/ProgresoScreen';
import ConsultarScreen from '../screens/ConsultarScreen';
import RutinasScreen from '../screens/RutinasScreen';
import { useTheme } from '../context/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import UserMenuModal from '../components/UserMenuModal';
import ProfileEditModal from '../components/ProfileEditModal';
import PreferencesModal from '../components/PreferencesModal';
import PaywallModal from '../components/PaywallModal';
import SubscriptionScreen from '../components/SubscriptionScreen';

const Tab = createBottomTabNavigator();

// Las 6 pestañas de la app original (ver App.jsx del proyecto web): registrar,
// historial, calendario, progreso, consultar, rutinas — ahora como bottom tabs nativos.
export default function RootNavigator() {
  const { COLORS } = useTheme();
  const { user } = useAuthContext();
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [preferencesVisible, setPreferencesVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [subscriptionVisible, setSubscriptionVisible] = useState(false);

  // Registrar e Historial son siempre gratis. El resto se bloquea cuando pasó
  // el mes de prueba y no hay suscripción activa (billing real: fase futura).
  const trial = user?.trial;
  const locked = !!trial && !trial.active && !trial.subscribed;

  // Al tocar una pestaña bloqueada no navega: abre el modal de aviso en su lugar.
  const gateListeners = {
    tabPress: (e) => {
      if (locked) {
        e.preventDefault();
        setPaywallVisible(true);
      }
    },
  };

  const gatedIcon = (IconComponent) => ({ color, size }) =>
    locked ? <Lock color={COLORS.chalkDim} size={size} /> : <IconComponent color={color} size={size} />;

  const gatedTintOptions = locked
    ? { tabBarActiveTintColor: COLORS.chalkDim, tabBarInactiveTintColor: COLORS.chalkDim }
    : {};

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <AppHeader onAvatarPress={() => setMenuVisible(true)} />

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
          options={{ tabBarIcon: gatedIcon(CalendarIcon), ...gatedTintOptions }}
          listeners={gateListeners}
        />
        <Tab.Screen
          name="Progreso"
          component={ProgresoScreen}
          options={{ tabBarIcon: gatedIcon(TrendingUp), ...gatedTintOptions }}
          listeners={gateListeners}
        />
        <Tab.Screen
          name="Consultar"
          component={ConsultarScreen}
          options={{ tabBarIcon: gatedIcon(MessageCircle), ...gatedTintOptions }}
          listeners={gateListeners}
        />
        <Tab.Screen
          name="Rutinas"
          component={RutinasScreen}
          options={{ tabBarIcon: gatedIcon(ListChecks), ...gatedTintOptions }}
          listeners={gateListeners}
        />
      </Tab.Navigator>

      <UserMenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onEditProfile={() => {
          setMenuVisible(false);
          setProfileVisible(true);
        }}
        onPreferences={() => {
          setMenuVisible(false);
          setPreferencesVisible(true);
        }}
      />
      <ProfileEditModal visible={profileVisible} onClose={() => setProfileVisible(false)} />
      <PreferencesModal visible={preferencesVisible} onClose={() => setPreferencesVisible(false)} />
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onSubscribe={() => {
          setPaywallVisible(false);
          setSubscriptionVisible(true);
        }}
      />
      <SubscriptionScreen visible={subscriptionVisible} onClose={() => setSubscriptionVisible(false)} />
    </View>
  );
}
