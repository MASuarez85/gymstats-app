import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuthContext } from '../context/AuthContext';

// Envuelve las pestañas pagas (Calendario, Progreso, Consultar, Rutinas): mientras
// el perfil está cargando no bloquea nada (evita un falso "bloqueado" al abrir la
// app), y una vez que sabemos el estado de trial, oculta la pantalla si ya venció
// y no hay suscripción activa. La suscripción paga real es una fase futura — hoy
// esto solo es el gate de "un mes de prueba".
export default function TrialGate({ children }) {
  const { user, loadingUser } = useAuthContext();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);

  if (loadingUser || !user) return children;

  const trial = user.trial;
  if (!trial || trial.active || trial.subscribed) return children;

  return (
    <SafeAreaView edges={[]} style={styles.screen}>
      <View style={styles.content}>
        <Lock size={32} color={COLORS.chalkDim} />
        <Text style={styles.title}>Prueba gratuita finalizada</Text>
        <Text style={styles.body}>
          Tu mes de prueba terminó. Las suscripciones pagas van a estar disponibles pronto para seguir usando esta
          sección.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
    title: { color: COLORS.chalk, fontSize: 16, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
    body: { color: COLORS.chalkDim, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  });
