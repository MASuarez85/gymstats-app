import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Plus, Check } from 'lucide-react-native';
import { COLORS, MUSCLE_GROUPS } from '../theme/colors';
import { useGymDataContext } from '../context/GymDataContext';
import { analyzeVisionPhoto } from '../api/client';
import { todayISO } from '../utils/date';
import ActivityRings from '../components/ActivityRings';
import StampBadge from '../components/StampBadge';
import ChipRow from '../components/ChipRow';

const SET_GOAL = 15; // meta semanal de series, igual que en la versión web
const REPS_OPTIONS = [15, 12, 10, 8, 6];

// Semana actual (lunes a domingo), para los anillos de actividad. Portado de App.jsx.
function getWeekBounds() {
  const now = new Date();
  const dow = now.getDay();
  const diffToMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
}

function emptyDraft(overrides) {
  return {
    exercise: '',
    muscle_group: MUSCLE_GROUPS[0],
    confidence: null,
    setsList: [{ weight: '', reps: '' }],
    date: todayISO(),
    ...overrides,
  };
}

export default function RegistrarScreen() {
  const { entries, dayPlans, addEntry, setPlanForDate } = useGymDataContext();
  const navigation = useNavigation();
  const route = useRoute();

  const [photoPreview, setPhotoPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [draft, setDraft] = useState(null);
  const [showStamp, setShowStamp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingConflict, setPendingConflict] = useState(null); // { entry, plannedGroup, detectedGroup }

  // Precarga el formulario cuando venís de "Cargar series" en el checklist de
  // una rutina, en la pestaña Calendario (equivalente a startManualDraft en la web).
  useEffect(() => {
    const { prefillExercise, prefillMuscleGroup, prefillDate, prefillNonce } = route.params || {};
    if (!prefillNonce) return;
    setPhotoPreview(null);
    setAnalysisError(null);
    setDraft(
      emptyDraft({
        exercise: prefillExercise || '',
        muscle_group: MUSCLE_GROUPS.includes(prefillMuscleGroup) ? prefillMuscleGroup : MUSCLE_GROUPS[0],
        date: prefillDate || todayISO(),
      })
    );
    navigation.setParams({ prefillExercise: undefined, prefillMuscleGroup: undefined, prefillDate: undefined, prefillNonce: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.prefillNonce]);

  const weekBounds = getWeekBounds();
  const weekEntries = entries.filter((e) => e.date >= weekBounds.start && e.date <= weekBounds.end);
  const weekDaysTrained = new Set(weekEntries.map((e) => e.date)).size;
  const weekSets = weekEntries.reduce((sum, e) => sum + e.sets.length, 0);
  const weekMuscleGroups = new Set(weekEntries.map((e) => e.muscle_group)).size;

  const resetCapture = () => {
    setPhotoPreview(null);
    setAnalysisError(null);
    setDraft(null);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setAnalysisError('Necesitamos permiso de cámara para poder analizar la máquina.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 });
    if (result.canceled || !result.assets || !result.assets[0]) return;

    const asset = result.assets[0];
    setAnalysisError(null);
    setDraft(null);
    setPhotoPreview(asset.uri);
    setAnalyzing(true);
    try {
      const analysis = await analyzeVisionPhoto(asset.base64);
      setDraft(
        emptyDraft({
          exercise: analysis.exercise || '',
          muscle_group: MUSCLE_GROUPS.includes(analysis.muscle_group) ? analysis.muscle_group : MUSCLE_GROUPS[0],
          confidence: analysis.confidence || 'media',
        })
      );
    } catch (err) {
      setAnalysisError(err.message || 'Error al analizar la foto');
      setDraft(emptyDraft());
    } finally {
      setAnalyzing(false);
    }
  };

  const startManualDraft = () => {
    setPhotoPreview(null);
    setAnalysisError(null);
    setDraft(emptyDraft());
  };

  const updateSetRow = (index, field, value) => {
    setDraft((d) => ({ ...d, setsList: d.setsList.map((s, i) => (i === index ? { ...s, [field]: value } : s)) }));
  };

  const addSetRow = () => {
    setDraft((d) => ({ ...d, setsList: [...d.setsList, { weight: '', reps: '' }] }));
  };

  const removeSetRow = (index) => {
    setDraft((d) => ({ ...d, setsList: d.setsList.filter((_, i) => i !== index) }));
  };

  const validSets = (draft && draft.setsList ? draft.setsList.filter((s) => s.weight !== '' && s.reps !== '') : []).map(
    (s) => ({ weight: Number(s.weight), reps: Number(s.reps) })
  );

  const finalizeSave = async (entry, { updatePlan, planGroup } = {}) => {
    setSaving(true);
    try {
      await addEntry(entry);
      if (updatePlan) await setPlanForDate(entry.date, planGroup);
      setShowStamp(true);
      setTimeout(() => setShowStamp(false), 1200);
      setTimeout(resetCapture, 600);
    } catch (err) {
      setAnalysisError('No se pudo guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveEntry = async () => {
    if (!draft || !draft.exercise || validSets.length === 0) return;
    const entry = {
      exercise: draft.exercise,
      muscleGroup: draft.muscle_group,
      sets: validSets,
      date: draft.date,
    };
    const plannedGroup = dayPlans[entry.date];

    if (!plannedGroup) {
      // Sin plan declarado: se completa solo con el primer registro del día.
      await finalizeSave(entry, { updatePlan: true, planGroup: entry.muscleGroup });
      return;
    }
    if (plannedGroup === entry.muscleGroup) {
      await finalizeSave(entry);
      return;
    }
    // Hay plan declarado y no coincide: preguntamos antes de guardar.
    setPendingConflict({ entry, plannedGroup, detectedGroup: entry.muscleGroup });
  };

  const resolveConflict = async (replace) => {
    if (!pendingConflict) return;
    const { entry, detectedGroup } = pendingConflict;
    setPendingConflict(null);
    await finalizeSave(entry, replace ? { updatePlan: true, planGroup: detectedGroup } : {});
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <ConflictModal pendingConflict={pendingConflict} onResolve={resolveConflict} />

      {!photoPreview && !draft && (
        <View style={styles.weekCard}>
          <ActivityRings move={weekDaysTrained / 7} exercise={weekSets / SET_GOAL} stand={weekMuscleGroups / MUSCLE_GROUPS.length} />
          <View style={{ flex: 1 }}>
            <Text style={styles.weekLabel}>Esta semana</Text>
            <StatRow color={COLORS.hazard} text={`${weekDaysTrained} de 7 días`} />
            <StatRow color={COLORS.brass} text={`${weekSets} de ${SET_GOAL} series`} />
            <StatRow color={COLORS.stand} text={`${weekMuscleGroups} de ${MUSCLE_GROUPS.length} grupos`} />
          </View>
        </View>
      )}

      {!photoPreview && !draft && (
        <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
          <Camera size={40} color={COLORS.brass} />
          <Text style={styles.captureTitle}>Fotografiá la máquina</Text>
          <Text style={styles.captureSubtitle}>Se detecta el ejercicio automáticamente</Text>
        </TouchableOpacity>
      )}

      {!photoPreview && !draft && (
        <TouchableOpacity onPress={startManualDraft} style={{ marginTop: 14, alignItems: 'center' }}>
          <Text style={{ color: COLORS.chalkDim, fontSize: 13 }}>Cargar manualmente, sin foto</Text>
        </TouchableOpacity>
      )}

      {(photoPreview || draft) && (
        <View>
          {photoPreview && (
            <View style={styles.previewWrap}>
              <Image source={{ uri: photoPreview }} style={styles.previewImage} />
              <TouchableOpacity style={styles.closeButton} onPress={resetCapture}>
                <X size={16} color={COLORS.chalk} />
              </TouchableOpacity>
              <StampBadge show={showStamp} />
            </View>
          )}

          {!photoPreview && draft && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: COLORS.chalkDim, fontSize: 12 }}>Carga manual</Text>
              <TouchableOpacity onPress={resetCapture}>
                <Text style={{ color: COLORS.chalkDim, fontSize: 12 }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

          {analyzing && (
            <View style={styles.analyzingRow}>
              <ActivityIndicator color={COLORS.brass} />
              <Text style={{ color: COLORS.brass, fontSize: 14 }}>Analizando máquina…</Text>
            </View>
          )}

          {analysisError && <Text style={styles.errorText}>{analysisError}</Text>}

          {draft && !analyzing && (
            <View style={{ marginTop: photoPreview ? 16 : 0, gap: 12 }}>
              {draft.confidence && (
                <Text style={{ color: COLORS.chalkDim, fontSize: 12 }}>
                  Confianza de detección: <Text style={{ color: COLORS.brass }}>{draft.confidence}</Text>
                </Text>
              )}

              <View>
                <Text style={styles.label}>Ejercicio</Text>
                <TextInput
                  style={styles.input}
                  value={draft.exercise}
                  onChangeText={(v) => setDraft({ ...draft, exercise: v })}
                  placeholder="Ej: Press de banca"
                  placeholderTextColor={COLORS.chalkDim}
                />
              </View>

              <View>
                <Text style={styles.label}>Grupo muscular</Text>
                <ChipRow options={MUSCLE_GROUPS} value={draft.muscle_group} onChange={(v) => setDraft({ ...draft, muscle_group: v })} />
              </View>

              <View>
                <View style={styles.setsHeader}>
                  <Text style={[styles.setsHeaderCell, { flex: 1 }]}>Peso (kg)</Text>
                  <Text style={[styles.setsHeaderCell, { flex: 1 }]}>Reps</Text>
                  <View style={{ width: 28 }} />
                </View>
                {draft.setsList.map((s, i) => (
                  <View key={i} style={styles.setRow}>
                    <Text style={styles.setIndex}>{i + 1}</Text>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={COLORS.chalkDim}
                      value={s.weight}
                      onChangeText={(v) => updateSetRow(i, 'weight', v)}
                    />
                    <View style={{ flex: 1 }}>
                      <ChipRow small options={REPS_OPTIONS} value={Number(s.reps) || null} onChange={(v) => updateSetRow(i, 'reps', String(v))} />
                    </View>
                    <TouchableOpacity
                      onPress={() => removeSetRow(i)}
                      disabled={draft.setsList.length === 1}
                      style={{ width: 28, height: 36, alignItems: 'center', justifyContent: 'center', opacity: draft.setsList.length === 1 ? 0.25 : 1 }}
                    >
                      <X size={15} color={COLORS.chalkDim} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={addSetRow} style={styles.addSetButton}>
                  <Plus size={14} color={COLORS.brass} />
                  <Text style={{ color: COLORS.brass, fontSize: 13 }}>Agregar serie</Text>
                </TouchableOpacity>
              </View>

              <View>
                <Text style={styles.label}>Fecha</Text>
                <TextInput
                  style={styles.input}
                  value={draft.date}
                  onChangeText={(v) => setDraft({ ...draft, date: v })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.chalkDim}
                />
              </View>

              <TouchableOpacity
                onPress={saveEntry}
                disabled={!draft.exercise || validSets.length === 0 || saving}
                style={[
                  styles.saveButton,
                  { backgroundColor: draft.exercise && validSets.length > 0 ? COLORS.hazard : COLORS.hazardDim },
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Check size={18} color="#fff" />
                    <Text style={styles.saveButtonText}>
                      Registrar {validSets.length > 1 ? `${validSets.length} series` : 'set'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({ color, text }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ color: COLORS.chalk, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

function ConflictModal({ pendingConflict, onResolve }) {
  if (!pendingConflict) return null;
  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>¿Cambiar el plan del día?</Text>
          <Text style={styles.modalBody}>
            Tenías planificado <Text style={{ color: COLORS.brass, fontWeight: '600' }}>{pendingConflict.plannedGroup}</Text>, pero la
            foto detectó <Text style={{ color: COLORS.hazard, fontWeight: '600' }}>{pendingConflict.detectedGroup}</Text>. ¿Querés
            reemplazar el grupo planificado de ese día?
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: COLORS.surfaceRaised }]} onPress={() => onResolve(false)}>
              <Text style={{ color: COLORS.chalk, fontSize: 13 }}>Mantener {pendingConflict.plannedGroup}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: COLORS.hazard }]} onPress={() => onResolve(true)}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Reemplazar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 18, paddingBottom: 40 },
  weekCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  weekLabel: { fontSize: 11, color: COLORS.chalkDim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  captureButton: {
    height: 220,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.line,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  captureTitle: { fontSize: 16, letterSpacing: 1, color: COLORS.chalk, textTransform: 'uppercase' },
  captureSubtitle: { fontSize: 12, color: COLORS.chalkDim },
  previewWrap: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.line },
  previewImage: { width: '100%', height: 200 },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(21,21,19,0.75)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  errorText: { marginTop: 12, fontSize: 13, color: COLORS.hazard },
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
  setsHeader: { flexDirection: 'row', marginBottom: 6, paddingLeft: 26 },
  setsHeaderCell: { fontSize: 11, color: COLORS.chalkDim },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  setIndex: { width: 18, fontSize: 12, color: COLORS.brass, textAlign: 'center' },
  addSetButton: {
    marginTop: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.line,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveButton: {
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 15, letterSpacing: 1, textTransform: 'uppercase' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(10,10,9,0.82)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, padding: 20, maxWidth: 340, gap: 12 },
  modalTitle: { fontSize: 16, letterSpacing: 0.5, textTransform: 'uppercase', color: COLORS.chalk },
  modalBody: { fontSize: 13, lineHeight: 19, color: COLORS.chalkDim },
  modalButton: { flex: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
});
