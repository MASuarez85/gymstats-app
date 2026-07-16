import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { COLORS, MUSCLE_GROUPS, MUSCLE_COLORS } from '../theme/colors';
import { useGymDataContext } from '../context/GymDataContext';
import { todayISO, formatDateHuman } from '../utils/date';
import ChipRow from '../components/ChipRow';

const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const pad2 = (n) => String(n).padStart(2, '0');

// Portado de la pestaña "calendario" de App.jsx: grilla mensual, plan y rutina
// asignados por día, y checklist de progreso. La exportación a Calendario de
// iPhone / Google Calendar de la versión web queda pendiente (necesitaría
// expo-calendar u otra dependencia nueva).
export default function CalendarioScreen() {
  const navigation = useNavigation();
  const { entries, dayPlans, routines, routineAssignments, routineProgress, setPlanForDate, assignRoutineToDate, toggleRoutineExerciseDone } =
    useGymDataContext();

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(null);

  const grouped = entries.reduce((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});

  const calYear = calendarMonth.getFullYear();
  const calMonthIdx = calendarMonth.getMonth();
  const firstWeekday = new Date(calYear, calMonthIdx, 1).getDay();
  const daysInMonth = new Date(calYear, calMonthIdx + 1, 0).getDate();
  const calCells = [...Array.from({ length: firstWeekday }).map(() => null), ...Array.from({ length: daysInMonth }).map((_, i) => i + 1)];
  const monthLabel = calendarMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const cellISO = (day) => `${calYear}-${pad2(calMonthIdx + 1)}-${pad2(day)}`;

  const selectedDayEntries = selectedDate ? grouped[selectedDate] || [] : [];
  const selectedDayPlan = selectedDate ? dayPlans[selectedDate] : null;
  const selectedRoutineId = selectedDate ? routineAssignments[selectedDate] : null;
  const selectedRoutine = selectedRoutineId ? routines.find((r) => r.id === selectedRoutineId) : null;
  const selectedRoutineProgress = selectedDate ? routineProgress[selectedDate] || {} : {};

  const goToExercise = (exercise, muscleGroup) => {
    navigation.navigate('Registrar', {
      prefillExercise: exercise,
      prefillMuscleGroup: muscleGroup,
      prefillDate: selectedDate || todayISO(),
      prefillNonce: Date.now(), // para que useEffect dispare aunque se repita el mismo ejercicio
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={() => setCalendarMonth(new Date(calYear, calMonthIdx - 1, 1))} style={{ padding: 6 }}>
            <ChevronLeft size={18} color={COLORS.chalkDim} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => setCalendarMonth(new Date(calYear, calMonthIdx + 1, 1))} style={{ padding: 6 }}>
            <ChevronRight size={18} color={COLORS.chalkDim} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((d, i) => (
            <Text key={i} style={styles.weekdayLabel}>{d}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {calCells.map((day, i) => {
            if (day === null) return <View key={i} style={styles.cell} />;
            const iso = cellISO(day);
            const hasEntries = !!grouped[iso];
            const plan = dayPlans[iso];
            const isSelected = selectedDate === iso;
            const isToday = iso === todayISO();
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.cell,
                  {
                    borderColor: isToday ? COLORS.brass : plan ? MUSCLE_COLORS[plan] : COLORS.line,
                    borderBottomWidth: plan ? 3 : 1,
                    backgroundColor: isSelected ? COLORS.hazard : hasEntries ? COLORS.surfaceRaised : 'transparent',
                  },
                ]}
                onPress={() => setSelectedDate(isSelected ? null : iso)}
              >
                <Text style={{ color: isSelected ? '#fff' : COLORS.chalk, fontSize: 12 }}>{day}</Text>
                {hasEntries && !isSelected && <View style={styles.entryDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.legendRow}>
          {MUSCLE_GROUPS.filter((mg) => Object.values(dayPlans).includes(mg)).map((mg) => (
            <View key={mg} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: MUSCLE_COLORS[mg] }} />
              <Text style={{ fontSize: 10, color: COLORS.chalkDim }}>{mg}</Text>
            </View>
          ))}
        </View>

        {selectedDate && (
          <View style={{ marginTop: 18 }}>
            <Text style={styles.selectedDateLabel}>{formatDateHuman(selectedDate)}</Text>

            <View style={{ marginBottom: 14 }}>
              <Text style={styles.label}>Grupo muscular planificado</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <ChipRow
                  small
                  options={MUSCLE_GROUPS}
                  value={selectedDayPlan}
                  onChange={(v) => setPlanForDate(selectedDate, v)}
                />
              </View>
              {selectedDayPlan && (
                <TouchableOpacity onPress={() => setPlanForDate(selectedDate, null)} style={{ marginTop: 6 }}>
                  <Text style={{ color: COLORS.chalkDim, fontSize: 11 }}>Quitar plan</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={styles.label}>Rutina asignada</Text>
              {routines.length === 0 ? (
                <Text style={{ fontSize: 11, color: COLORS.chalkDim, marginTop: 6 }}>
                  Todavía no creaste ninguna rutina. Andá a la pestaña Rutinas.
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {routines.map((r) => {
                    const active = selectedRoutineId === r.id;
                    return (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => assignRoutineToDate(selectedDate, active ? null : r.id)}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          backgroundColor: active ? COLORS.hazard : COLORS.surfaceRaised,
                          borderWidth: 1,
                          borderColor: active ? COLORS.hazard : COLORS.line,
                        }}
                      >
                        <Text style={{ color: active ? '#fff' : COLORS.chalk, fontSize: 13 }}>{r.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {selectedRoutine && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.routineTitle}>{selectedRoutine.name}</Text>
                <View style={{ gap: 6 }}>
                  {selectedRoutine.exercises.map((ex) => {
                    const done = !!selectedRoutineProgress[ex.id];
                    return (
                      <View key={ex.id} style={[styles.exerciseRow, { opacity: done ? 0.6 : 1 }]}>
                        <TouchableOpacity
                          onPress={() => toggleRoutineExerciseDone(selectedDate, ex.id)}
                          style={[styles.checkCircle, { borderColor: done ? COLORS.brass : COLORS.chalkDim, backgroundColor: done ? COLORS.brass : 'transparent' }]}
                        >
                          {done && <Check size={14} strokeWidth={3} color="#000" />}
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.chalk, textDecorationLine: done ? 'line-through' : 'none' }}>
                            {ex.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: COLORS.chalkDim }}>
                            {ex.muscle_group} · {ex.targetSets}x{ex.targetReps}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => goToExercise(ex.name, ex.muscle_group)} style={styles.loadButton}>
                          <Text style={{ fontSize: 11, color: COLORS.chalk }}>Cargar series</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {selectedDayEntries.length === 0 ? (
              <Text style={{ fontSize: 13, color: COLORS.chalkDim, marginBottom: 14 }}>No entrenaste este día.</Text>
            ) : (
              <View style={{ marginBottom: 14 }}>
                {selectedDayEntries.map((e) => (
                  <View key={e.id} style={styles.entryCard}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.chalk }}>{e.exercise}</Text>
                    <Text style={{ fontSize: 11, color: COLORS.chalkDim, marginBottom: 4 }}>{e.muscle_group}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {e.sets.map((s, i) => (
                        <Text key={i} style={styles.setChip}>{s.weight}kg×{s.reps}</Text>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 18, paddingBottom: 40 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  monthLabel: { fontSize: 15, letterSpacing: 0.5, textTransform: 'capitalize', color: COLORS.chalk },
  weekdayRow: { flexDirection: 'row', marginBottom: 6 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 10, color: COLORS.chalkDim },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginBottom: 4,
  },
  entryDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.hazard },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  selectedDateLabel: { fontSize: 13, textTransform: 'capitalize', color: COLORS.chalkDim, letterSpacing: 0.5, marginBottom: 10 },
  label: { fontSize: 12, color: COLORS.chalkDim, marginBottom: 4 },
  routineTitle: { fontSize: 11, color: COLORS.chalkDim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  loadButton: { backgroundColor: COLORS.surfaceRaised, borderWidth: 1, borderColor: COLORS.line, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  entryCard: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: COLORS.line },
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
});
