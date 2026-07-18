import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Plus, X, Trash2, Camera, Check } from 'lucide-react-native';
import { MUSCLE_GROUPS } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useGymDataContext } from '../context/GymDataContext';
import { analyzeRoutinePhoto } from '../api/client';
import { uid } from '../utils/date';
import ChipRow from '../components/ChipRow';

const REPS_OPTIONS = [15, 12, 10, 8, 6];

function newExercise() {
  return { id: uid(), name: '', muscle_group: MUSCLE_GROUPS[0], targetSets: 3, targetReps: 10 };
}

// Portado de la pestaña "rutinas" de App.jsx: lista de rutinas guardadas +
// constructor (a mano o completado desde una foto de un plan de entrenamiento).
export default function RutinasScreen() {
  const { routines, addRoutine, editRoutine, removeRoutine } = useGymDataContext();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [draft, setDraft] = useState(null); // { id?, name, exercises: [...] }
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setPhotoError(null);
    setDraft({ name: '', exercises: [newExercise()] });
    setBuilderOpen(true);
  };

  const openEdit = (routine) => {
    setPhotoError(null);
    setDraft(JSON.parse(JSON.stringify(routine)));
    setBuilderOpen(true);
  };

  const closeBuilder = () => {
    setBuilderOpen(false);
    setDraft(null);
    setPhotoError(null);
  };

  const updateExercise = (index, field, value) => {
    setDraft((d) => ({ ...d, exercises: d.exercises.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)) }));
  };

  const addExerciseRow = () => {
    setDraft((d) => ({ ...d, exercises: [...d.exercises, newExercise()] }));
  };

  const removeExerciseRow = (index) => {
    setDraft((d) => ({ ...d, exercises: d.exercises.filter((_, i) => i !== index) }));
  };

  const handlePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setPhotoError('Necesitamos permiso de cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 });
    if (result.canceled || !result.assets || !result.assets[0]) return;

    setPhotoError(null);
    setPhotoAnalyzing(true);
    try {
      const parsed = await analyzeRoutinePhoto(result.assets[0].base64);
      setDraft((d) => ({
        id: d?.id,
        name: parsed.name || d?.name || '',
        exercises: (parsed.exercises || []).map((ex) => ({
          id: uid(),
          name: ex.name || '',
          muscle_group: MUSCLE_GROUPS.includes(ex.muscle_group) ? ex.muscle_group : MUSCLE_GROUPS[0],
          targetSets: Number(ex.targetSets) || 3,
          targetReps: Number(ex.targetReps) || 10,
        })),
      }));
    } catch (err) {
      setPhotoError(err.message || 'No se pudo leer la foto');
    } finally {
      setPhotoAnalyzing(false);
    }
  };

  const saveRoutine = async () => {
    if (!draft || !draft.name.trim()) return;
    const validExercises = draft.exercises.filter((ex) => ex.name.trim());
    if (validExercises.length === 0) return;

    setSaving(true);
    try {
      const payload = { name: draft.name.trim(), exercises: validExercises };
      if (draft.id) {
        await editRoutine(draft.id, payload);
      } else {
        await addRoutine(payload);
      }
      closeBuilder();
    } catch (err) {
      setPhotoError('No se pudo guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (routine) => {
    Alert.alert('Borrar rutina', `¿Borrar "${routine.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => removeRoutine(routine.id) },
    ]);
  };

  if (builderOpen && draft) {
    return (
      <SafeAreaView style={styles.screen} edges={[]}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
          <View style={styles.builderHeader}>
            <TouchableOpacity onPress={closeBuilder}>
              <Text style={{ color: COLORS.chalkDim, fontSize: 14 }}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={{ color: COLORS.chalk, fontSize: 14, fontWeight: '600' }}>
              {draft.id ? 'Editar rutina' : 'Nueva rutina'}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <TouchableOpacity onPress={handlePhoto} style={styles.photoButton} disabled={photoAnalyzing}>
            <Camera size={16} color={COLORS.brass} />
            <Text style={{ color: COLORS.brass, fontSize: 13 }}>
              {photoAnalyzing ? 'Leyendo la foto…' : 'Completar desde una foto'}
            </Text>
          </TouchableOpacity>
          {photoError && <Text style={styles.errorText}>{photoError}</Text>}

          <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>Nombre de la rutina</Text>
            <TextInput
              style={styles.input}
              value={draft.name}
              onChangeText={(v) => setDraft({ ...draft, name: v })}
              placeholder="Ej: Rutina Push"
              placeholderTextColor={COLORS.chalkDim}
            />
          </View>

          <View style={{ gap: 10, marginBottom: 12 }}>
            {draft.exercises.map((ex, i) => (
              <View key={ex.id} style={styles.exerciseCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={ex.name}
                    onChangeText={(v) => updateExercise(i, 'name', v)}
                    placeholder="Nombre del ejercicio"
                    placeholderTextColor={COLORS.chalkDim}
                  />
                  <TouchableOpacity
                    onPress={() => removeExerciseRow(i)}
                    disabled={draft.exercises.length === 1}
                    style={{ width: 28, height: 36, alignItems: 'center', justifyContent: 'center', opacity: draft.exercises.length === 1 ? 0.25 : 1 }}
                  >
                    <X size={15} color={COLORS.chalkDim} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.label, { marginBottom: 6 }]}>Grupo muscular</Text>
                <ChipRow small options={MUSCLE_GROUPS} value={ex.muscle_group} onChange={(v) => updateExercise(i, 'muscle_group', v)} />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { marginBottom: 6 }]}>Series</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={String(ex.targetSets)}
                      onChangeText={(v) => updateExercise(i, 'targetSets', Number(v) || 0)}
                    />
                  </View>
                  <View style={{ flex: 1.4 }}>
                    <Text style={[styles.label, { marginBottom: 6 }]}>Reps</Text>
                    <ChipRow small options={REPS_OPTIONS} value={ex.targetReps} onChange={(v) => updateExercise(i, 'targetReps', v)} />
                  </View>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={addExerciseRow} style={styles.addExerciseButton}>
            <Plus size={14} color={COLORS.brass} />
            <Text style={{ color: COLORS.brass, fontSize: 13 }}>Agregar ejercicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={saveRoutine}
            disabled={!draft.name.trim() || saving}
            style={[styles.saveButton, { backgroundColor: draft.name.trim() ? COLORS.hazard : COLORS.hazardDim }]}
          >
            <Check size={18} color="#fff" />
            <Text style={styles.saveButtonText}>{saving ? 'Guardando…' : 'Guardar rutina'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={openNew} style={styles.newRoutineButton}>
          <Plus size={18} color="#fff" />
          <Text style={styles.newRoutineText}>Nueva rutina</Text>
        </TouchableOpacity>

        {routines.length === 0 && (
          <Text style={styles.empty}>
            Todavía no armaste ninguna rutina. Podés cargarla a mano o sacarle una foto a tu plan de entrenamiento.
          </Text>
        )}

        {routines.map((r) => {
          const groups = Array.from(new Set(r.exercises.map((ex) => ex.muscle_group)));
          return (
            <View key={r.id} style={styles.routineCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineName}>{r.name}</Text>
                  <Text style={styles.routineMeta}>
                    {r.exercises.length} ejercicios · {groups.join(', ')}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TouchableOpacity onPress={() => openEdit(r)} style={{ padding: 6 }}>
                    <Text style={{ color: COLORS.chalkDim, fontSize: 12 }}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(r)} style={{ padding: 6 }}>
                    <Trash2 size={15} color={COLORS.chalkDim} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {r.exercises.map((ex) => (
                  <Text key={ex.id} style={styles.exerciseChip}>
                    {ex.name} · {ex.targetSets}x{ex.targetReps}
                  </Text>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: 18, paddingBottom: 40 },
    newRoutineButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: COLORS.hazard,
      borderRadius: 14,
      paddingVertical: 14,
      marginBottom: 16,
    },
    newRoutineText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    empty: { textAlign: 'center', color: COLORS.chalkDim, paddingVertical: 30, fontSize: 13 },
    routineCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.line, borderRadius: 16, padding: 14, marginBottom: 10 },
    routineName: { fontSize: 16, fontWeight: '700', color: COLORS.chalk },
    routineMeta: { fontSize: 12, color: COLORS.chalkDim, marginTop: 2 },
    exerciseChip: {
      fontSize: 11,
      color: COLORS.chalk,
      backgroundColor: COLORS.surfaceRaised,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 4,
      paddingVertical: 2,
      paddingHorizontal: 6,
      overflow: 'hidden',
    },
    builderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    photoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: COLORS.line,
      borderRadius: 14,
      paddingVertical: 12,
      marginBottom: 16,
    },
    errorText: { fontSize: 12, color: COLORS.hazard, marginBottom: 12 },
    label: { fontSize: 12, color: COLORS.chalkDim },
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
    exerciseCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, padding: 12 },
    addExerciseButton: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: COLORS.line,
      borderRadius: 10,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginBottom: 16,
    },
    saveButton: {
      borderRadius: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  });
