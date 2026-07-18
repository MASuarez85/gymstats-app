import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, Minus } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const FEATURES = [
  { label: 'Registrar entrenamientos (cámara + IA)', free: true, premium: true },
  { label: 'Historial de entrenamientos', free: true, premium: true },
  { label: 'Calendario y planificación', free: false, premium: true },
  { label: 'Gráficos de progreso', free: false, premium: true },
  { label: 'Consultas a la IA', free: false, premium: true },
  { label: 'Rutinas guardadas', free: false, premium: true },
];

// Pantalla de detalle de la suscripción (precio + comparativo gratis/premium).
// El botón todavía no cobra de verdad: falta conectar Apple In-App Purchases
// (StoreKit) del lado de la app y el webhook del lado del server — es la
// próxima fase, esto deja la UI lista para ese momento.
export default function SubscriptionScreen({ visible, onClose }) {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  if (!visible) return null;

  const handleSubscribe = () => {
    Alert.alert(
      'Próximamente',
      'La compra dentro de la app todavía no está activada. Esta pantalla ya queda lista para conectarse a las suscripciones de Apple en la próxima fase.'
    );
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>GymStats Premium</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <X size={20} color={COLORS.chalkDim} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.priceCard}>
            <Text style={styles.price}>US$20</Text>
            <Text style={styles.priceSub}>por mes</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'left' }]}> </Text>
              <Text style={styles.tableHeaderCell}>Gratis</Text>
              <Text style={[styles.tableHeaderCell, { color: COLORS.brass }]}>Premium</Text>
            </View>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.tableRow}>
                <Text style={[styles.featureLabel, { flex: 2 }]}>{f.label}</Text>
                <View style={styles.tableCell}>
                  {f.free ? <Check size={16} color={COLORS.chalkDim} /> : <Minus size={16} color={COLORS.chalkDim} />}
                </View>
                <View style={styles.tableCell}>
                  {f.premium ? <Check size={16} color={COLORS.brass} /> : <Minus size={16} color={COLORS.chalkDim} />}
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
            <Text style={styles.subscribeButtonText}>Suscribirme — US$20/mes</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Registrar e Historial siguen siendo gratis para siempre. Cancelás cuando quieras.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.line,
    },
    headerTitle: { color: COLORS.chalk, fontSize: 15, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
    content: { padding: 20, gap: 22, paddingBottom: 40 },
    priceCard: { alignItems: 'center', gap: 2, paddingVertical: 10 },
    price: { color: COLORS.brass, fontSize: 40, fontWeight: '700' },
    priceSub: { color: COLORS.chalkDim, fontSize: 13 },
    table: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, overflow: 'hidden' },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: COLORS.surfaceRaised, paddingVertical: 10, paddingHorizontal: 12 },
    tableHeaderCell: { flex: 1, color: COLORS.chalkDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderTopWidth: 1,
      borderTopColor: COLORS.line,
    },
    featureLabel: { color: COLORS.chalk, fontSize: 12.5 },
    tableCell: { flex: 1, alignItems: 'center' },
    subscribeButton: { backgroundColor: COLORS.hazard, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    subscribeButtonText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase' },
    disclaimer: { color: COLORS.chalkDim, fontSize: 11, textAlign: 'center', lineHeight: 16 },
  });
