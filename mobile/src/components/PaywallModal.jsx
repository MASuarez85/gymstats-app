import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

// Se muestra al tocar una pestaña bloqueada (en vez de navegar y mostrar la
// pantalla vacía). Cerrar te deja donde estabas; Comprar abre SubscriptionScreen.
export default function PaywallModal({ visible, onClose, onSubscribe }) {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Lock size={28} color={COLORS.chalkDim} />
          <Text style={styles.title}>Prueba gratuita finalizada</Text>
          <Text style={styles.body}>
            Tu mes de prueba terminó. Suscribite para seguir usando Calendario, Progreso, Consultar y Rutinas.
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.surfaceRaised }]} onPress={onClose}>
              <Text style={{ color: COLORS.chalk, fontSize: 13 }}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.hazard }]} onPress={onSubscribe}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Comprar suscripción</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(10,10,9,0.82)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: {
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 14,
      padding: 22,
      maxWidth: 340,
      width: '100%',
      alignItems: 'center',
      gap: 12,
    },
    title: { fontSize: 15, letterSpacing: 0.5, textTransform: 'uppercase', color: COLORS.chalk, textAlign: 'center' },
    body: { fontSize: 13, lineHeight: 19, color: COLORS.chalkDim, textAlign: 'center' },
    buttonRow: { flexDirection: 'row', gap: 8, width: '100%', marginTop: 4 },
    button: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  });
