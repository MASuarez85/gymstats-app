import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Trash2, Pencil, Plus, X, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useGymDataContext } from '../context/GymDataContext';
import { formatDateHuman } from '../utils/date';
import PlateStack from '../components/PlateStack';
import ChipRow from '../components/ChipRow';

const REPS_OPTIONS = [15, 12, 10, 8, 6];

// Portado 1:1 de la pestaña "historial" de App.jsx: entrenamientos agrupados
// por fecha, más nuevos primero, con la pila de discos del set más pesado.
// Además permite reabrir un ejercicio para agregar/editar series, y borrar
// con confirmación (antes fallaba en silencio si no había señal en el gym).
export default function HistorialScreen() {
  const { entries, editEntry, removeEntry } = useGymDataContext();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const [editingId, setEditingId] = useState(null);
  const [editSets, setEditSets] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const grouped = entries.reduce((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditSets(entry.sets.map((s) => ({ weight: String(s.weight), reps: String(s.reps) })));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditSets([]);
  };

  const updateEditSet = (i, field, value) => {
    setEditSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const addEditSetRow = () => setEditSets((prev) => [...prev, { weight: '', reps: '' }]);
  const removeEditSetRow = (i) => setEditSets((prev) => prev.filter((_, idx) => idx !== i));

  const saveEdit = async () => {
    const validSets = editSets.filter((s) => s.weight !== '' && s.reps !== '').map((s) => ({ weight: Number(s.weight), reps: Number(s.reps) }));
    if (validSets.length === 0) {
      Alert.alert('Faltan datos', 'Cargá al menos una serie con peso y repeticiones.');
      return;
    }
    setSavingEdit(true);
    try {
      await editEntry(editingId, { sets: validSets });
      cancelEdit();
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = (entry) => {
    Alert.alert('Borrar ejercicio', `¿Borrar "${entry.exercise}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeEntry(entry.id);
          } catch (err) {
            Alert.alert('No se pudo borrar', err.message);
          }
        },
      },
    ]);
  };

  const renderEntry = (e) => {
    const maxKg = Math.max(...e.sets.map((s) => s.weight));
    const isEditing = editingId === e.id;

    if (isEditing) {
      return (
        <View key={e.id} style={[styles.entryCard, { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
          <Text style={styles.exerciseName}>{e.exercise}</Text>
          <Text style={styles.muscleGroup}>{e.muscle_group}</Text>
          {editSets.map((s, i) => (
            <View key={i} style={styles.editSetRow}>
              <Text style={styles.setIndex}>{i + 1}</Text>
              <TextInput
                style={[styles.editInput, { flex: 1 }]}
                keyboardType="decimal-pad"
                placeholder="Peso"
                placeholderTextColor={COLORS.chalkDim}
                value={s.weight}
                onChangeText={(v) => updateEditSet(i, 'weight', v)}
              />
              <View style={{ flex: 1 }}>
                <ChipRow small options={REPS_OPTIONS} value={Number(s.reps) || null} onChange={(v) => updateEditSet(i, 'reps', String(v))} />
              </View>
              <TouchableOpacity
                onPress={() => removeEditSetRow(i)}
                disabled={editSets.length === 1}
                style={{ width: 26, alignItems: 'center', opacity: editSets.length === 1 ? 0.25 : 1 }}
              >
                <X size={15} color={COLORS.chalkDim} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={addEditSetRow} style={styles.addSetButton}>
            <Plus size={14} color={COLORS.brass} />
            <Text style={{ color: COLORS.brass, fontSize: 13 }}>Agregar serie</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <TouchableOpacity onPress={cancelEdit} style={[styles.editActionButton, { backgroundColor: COLORS.surfaceRaised }]}>
              <Text style={{ color: COLORS.chalk, fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveEdit} disabled={savingEdit} style={[styles.editActionButton, { backgroundColor: COLORS.hazard }]}>
              {savingEdit ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Check size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View key={e.id} style={styles.entryCard}>
        <PlateStack kg={maxKg} />
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{e.exercise}</Text>
          <Text style={styles.muscleGroup}>{e.muscle_group}</Text>
          <View style={styles.setsRow}>
            {e.sets.map((s, i) => (
              <Text key={i} style={styles.setChip}>
                {s.weight}kg×{s.reps}
              </Text>
            ))}
          </View>
        </View>
        <TouchableOpacity onPress={() => startEdit(e)} style={{ padding: 4 }}>
          <Pencil size={15} color={COLORS.chalkDim} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmDelete(e)} style={{ padding: 4 }}>
          <Trash2 size={15} color={COLORS.chalkDim} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {sortedDates.length === 0 && (
          <Text style={styles.empty}>Todavía no registraste entrenamientos.</Text>
        )}

        {sortedDates.map((date) => {
          const dayEntries = grouped[date];
          const groups = Array.from(new Set(dayEntries.map((e) => e.muscle_group))).join(' · ');

          // Agrupa entries que comparten block_id (superseries) para mostrarlas juntas.
          const slots = [];
          const seenBlocks = new Set();
          dayEntries.forEach((e) => {
            if (e.block_id) {
              if (seenBlocks.has(e.block_id)) return;
              seenBlocks.add(e.block_id);
              slots.push({ type: 'superset', blockId: e.block_id, entries: dayEntries.filter((x) => x.block_id === e.block_id) });
            } else {
              slots.push({ type: 'single', entry: e });
            }
          });

          return (
            <View key={date} style={{ marginBottom: 20 }}>
              <View style={styles.dateHeader}>
                <Calendar size={14} color={COLORS.brass} />
                <Text style={styles.dateLabel}>{formatDateHuman(date)}</Text>
                <View style={styles.dateLine} />
                <Text style={styles.dateGroups}>{groups}</Text>
              </View>

              {slots.map((slot) =>
                slot.type === 'superset' ? (
                  <View key={slot.blockId} style={styles.supersetGroup}>
                    <Text style={styles.supersetLabel}>Superserie</Text>
                    {slot.entries.map((e) => renderEntry(e))}
                  </View>
                ) : (
                  renderEntry(slot.entry)
                )
              )}
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
    empty: { textAlign: 'center', color: COLORS.chalkDim, paddingVertical: 40, fontSize: 14 },
    dateHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    dateLabel: { fontSize: 14, textTransform: 'capitalize', letterSpacing: 0.5, color: COLORS.chalk },
    dateLine: { flex: 1, height: 1, backgroundColor: COLORS.line },
    dateGroups: { fontSize: 11, color: COLORS.chalkDim },
    entryCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: COLORS.surface,
      borderRadius: 10,
      padding: 12,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: COLORS.line,
    },
    exerciseName: { fontSize: 14, fontWeight: '600', color: COLORS.chalk },
    muscleGroup: { fontSize: 11, color: COLORS.chalkDim, marginBottom: 4 },
    setsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    setChip: {
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
    editSetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    setIndex: { width: 16, fontSize: 12, color: COLORS.brass, textAlign: 'center' },
    editInput: {
      backgroundColor: COLORS.surfaceRaised,
      borderWidth: 1,
      borderColor: COLORS.line,
      color: COLORS.chalk,
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 10,
      fontSize: 14,
    },
    addSetButton: {
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
    supersetGroup: {
      borderWidth: 1,
      borderColor: COLORS.stand,
      borderRadius: 12,
      padding: 6,
      marginBottom: 6,
      gap: 0,
    },
    supersetLabel: {
      fontSize: 10,
      color: COLORS.stand,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginLeft: 6,
      marginTop: 4,
      marginBottom: 4,
    },
    editActionButton: {
      flex: 1,
      borderRadius: 8,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
  });
