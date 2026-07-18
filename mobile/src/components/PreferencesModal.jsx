import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { X, HeartPulse } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import { useNotificationsContext } from '../context/NotificationsContext';

const THEME_OPTIONS = [
  { value: 'dark', label: 'Oscuro' },
  { value: 'light', label: 'Claro' },
  { value: 'auto', label: 'Automático' },
];

export default function PreferencesModal({ visible, onClose }) {
  const { COLORS, preference, setPreference } = useTheme();
  const { faceIdEnabled, setFaceIdEnabled } = useAuthContext();
  const { enabled: notificationsEnabled, setEnabled: setNotificationsEnabled } = useNotificationsContext();
  const styles = getStyles(COLORS);

  if (!visible) return null;

  const handleFaceIdToggle = async (value) => {
    const ok = await setFaceIdEnabled(value);
    if (!ok) {
      Alert.alert(
        'Face ID no disponible',
        'Este dispositivo no tiene Face ID/Touch ID configurado. Activalo en Ajustes del sistema y probá de nuevo.'
      );
    }
  };

  const handleNotificationsToggle = async (value) => {
    const ok = await setNotificationsEnabled(value);
    if (!ok) {
      Alert.alert(
        'Notificaciones bloqueadas',
        'No se pudo activar: el permiso de notificaciones está denegado. Activalo en Ajustes del sistema para GymStats.'
      );
    }
  };

  const handleAppleFitness = () => {
    Alert.alert(
      'Próximamente',
      'Conectar con Apple Fitness todavía no está disponible: hace falta habilitar el permiso de HealthKit para esta app en Apple Developer y un nuevo build. Queda para una próxima fase.'
    );
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Preferencias</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={18} color={COLORS.chalkDim} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ gap: 20 }}>
            <View>
              <Text style={styles.label}>Tema</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {THEME_OPTIONS.map((o) => {
                  const active = o.value === preference;
                  return (
                    <TouchableOpacity
                      key={o.value}
                      onPress={() => setPreference(o.value)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        backgroundColor: active ? COLORS.hazard : COLORS.surfaceRaised,
                        borderWidth: 1,
                        borderColor: active ? COLORS.hazard : COLORS.line,
                      }}
                    >
                      <Text style={{ color: active ? '#fff' : COLORS.chalk, fontSize: 13 }}>{o.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Notificaciones</Text>
                <Text style={styles.rowSubtitle}>Recordatorios para registrar tu primer entrenamiento y guardar tu rutina.</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: COLORS.surfaceRaised, true: COLORS.hazard }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Face ID</Text>
                <Text style={styles.rowSubtitle}>Pedir Face ID para abrir la app.</Text>
              </View>
              <Switch
                value={faceIdEnabled}
                onValueChange={handleFaceIdToggle}
                trackColor={{ false: COLORS.surfaceRaised, true: COLORS.hazard }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity style={styles.row} onPress={handleAppleFitness}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <HeartPulse size={18} color={COLORS.chalk} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Conectar con Apple Fitness</Text>
                  <Text style={styles.rowSubtitle}>Próximamente</Text>
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(10,10,9,0.82)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: COLORS.surface,
      borderTopWidth: 1,
      borderColor: COLORS.line,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 20,
      paddingBottom: 36,
      maxHeight: '85%',
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { color: COLORS.chalk, fontSize: 17, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
    label: { fontSize: 12, color: COLORS.chalkDim, marginBottom: 6 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: COLORS.surfaceRaised,
      borderRadius: 12,
      padding: 14,
    },
    rowTitle: { color: COLORS.chalk, fontSize: 14, fontWeight: '600' },
    rowSubtitle: { color: COLORS.chalkDim, fontSize: 11, marginTop: 2 },
  });
