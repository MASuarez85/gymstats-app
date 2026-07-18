import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MUSCLE_GROUPS } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useGymDataContext } from '../context/GymDataContext';
import ChipRow from '../components/ChipRow';
import SimpleBarChart from '../components/SimpleBarChart';
import SimpleLineChart from '../components/SimpleLineChart';

// Portado de la pestaña "progreso" de App.jsx: misma matemática de agregación,
// solo cambian los componentes de chart (ver comentarios en SimpleBarChart/SimpleLineChart).
export default function ProgresoScreen() {
  const { entries } = useGymDataContext();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const muscleFreq = MUSCLE_GROUPS.map((mg) => ({
    grupo: mg,
    veces: entries.filter((e) => e.muscle_group === mg).length,
  })).filter((m) => m.veces > 0);

  const exerciseNames = Array.from(new Set(entries.map((e) => e.exercise)));
  const [selectedExercise, setSelectedExercise] = useState(null);
  useEffect(() => {
    if ((!selectedExercise || !exerciseNames.includes(selectedExercise)) && exerciseNames.length) {
      setSelectedExercise(exerciseNames[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseNames.join('|')]);

  const exerciseHistory = entries
    .filter((e) => e.exercise === selectedExercise)
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((e) => ({ date: e.date.slice(5), peso: Math.max(...e.sets.map((s) => s.weight)) }));

  const activeMuscleGroups = MUSCLE_GROUPS.filter((mg) => entries.some((e) => e.muscle_group === mg));
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);
  useEffect(() => {
    if ((!selectedMuscleGroup || !activeMuscleGroups.includes(selectedMuscleGroup)) && activeMuscleGroups.length) {
      setSelectedMuscleGroup(activeMuscleGroups[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMuscleGroups.join('|')]);

  const muscleGroupHistory = (() => {
    const byDate = {};
    entries
      .filter((e) => e.muscle_group === selectedMuscleGroup)
      .forEach((e) => {
        const maxKg = Math.max(...e.sets.map((s) => s.weight));
        byDate[e.date] = byDate[e.date] ? Math.max(byDate[e.date], maxKg) : maxKg;
      });
    return Object.keys(byDate)
      .sort()
      .map((date) => ({ date: date.slice(5), peso: byDate[date] }));
  })();

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {entries.length === 0 && <Text style={styles.empty}>Registrá entrenamientos para ver tu progreso.</Text>}

        {muscleFreq.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>Frecuencia por grupo muscular</Text>
            <SimpleBarChart data={muscleFreq} valueKey="veces" labelKey="grupo" color={COLORS.brass} />
          </View>
        )}

        {exerciseNames.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>Evolución de peso</Text>
            <View style={{ marginBottom: 12 }}>
              <ChipRow small options={exerciseNames} value={selectedExercise} onChange={setSelectedExercise} />
            </View>
            <SimpleLineChart data={exerciseHistory} valueKey="peso" labelKey="date" color={COLORS.hazard} />
          </View>
        )}

        {activeMuscleGroups.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>Evolución por grupo muscular</Text>
            <View style={{ marginBottom: 12 }}>
              <ChipRow small options={activeMuscleGroups} value={selectedMuscleGroup} onChange={setSelectedMuscleGroup} />
            </View>
            <SimpleLineChart data={muscleGroupHistory} valueKey="peso" labelKey="date" color={COLORS.brass} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: 18, paddingBottom: 40 },
    empty: { textAlign: 'center', color: COLORS.chalkDim, paddingVertical: 40, fontSize: 14 },
    sectionTitle: { fontSize: 14, letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase', color: COLORS.chalkDim },
  });
