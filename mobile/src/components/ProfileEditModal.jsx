import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import ChipRow from './ChipRow';

const GOALS = ['Fuerza', 'Hipertrofia', 'Resistencia', 'Salud general'];

export default function ProfileEditModal({ visible, onClose }) {
  const { user, updateProfile } = useAuthContext();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const [displayName, setDisplayName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState(null);
  const [birthdate, setBirthdate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Recarga el form con lo que haya en el perfil cada vez que se abre.
  useEffect(() => {
    if (!visible || !user) return;
    setDisplayName(user.displayName || '');
    setHeight(user.height != null ? String(user.height) : '');
    setWeight(user.weight != null ? String(user.weight) : '');
    setGoal(user.goal || null);
    setBirthdate(user.birthdate || '');
    setError(null);
  }, [visible, user]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        displayName: displayName.trim() || null,
        height: height === '' ? null : Number(height),
        weight: weight === '' ? null : Number(weight),
        goal,
        birthdate: birthdate.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Editar perfil</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={18} color={COLORS.chalkDim} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ gap: 14 }} keyboardShouldPersistTaps="handled">
            <View>
              <Text style={styles.label}>Nombre para mostrar</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Ej: Chino"
                placeholderTextColor={COLORS.chalkDim}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Altura (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                  placeholder="178"
                  placeholderTextColor={COLORS.chalkDim}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholder="80"
                  placeholderTextColor={COLORS.chalkDim}
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>Objetivo</Text>
              <ChipRow options={GOALS} value={goal} onChange={setGoal} />
            </View>

            <View>
              <Text style={styles.label}>Fecha de nacimiento</Text>
              <TextInput
                style={styles.input}
                value={birthdate}
                onChangeText={setBirthdate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.chalkDim}
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity style={styles.saveButton} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Check size={17} color="#fff" />
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    label: { fontSize: 12, color: COLORS.chalkDim, marginBottom: 4 },
    input: {
      backgroundColor: COLORS.surfaceRaised,
      borderWidth: 1,
      borderColor: COLORS.line,
      color: COLORS.chalk,
      borderRadius: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      fontSize: 15,
    },
    error: { color: COLORS.hazard, fontSize: 13 },
    saveButton: {
      marginTop: 4,
      backgroundColor: COLORS.hazard,
      borderRadius: 8,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 15, letterSpacing: 1, textTransform: 'uppercase' },
  });
