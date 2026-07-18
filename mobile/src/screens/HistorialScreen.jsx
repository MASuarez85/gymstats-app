import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Trash2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useGymDataContext } from '../context/GymDataContext';
import { formatDateHuman } from '../utils/date';
import PlateStack from '../components/PlateStack';

// Portado 1:1 de la pestaña "historial" de App.jsx: entrenamientos agrupados
// por fecha, más nuevos primero, con la pila de discos del set más pesado.
export default function HistorialScreen() {
  const { entries, removeEntry } = useGymDataContext();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const grouped = entries.reduce((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {sortedDates.length === 0 && (
          <Text style={styles.empty}>Todavía no registraste entrenamientos.</Text>
        )}

        {sortedDates.map((date) => {
          const dayEntries = grouped[date];
          const groups = Array.from(new Set(dayEntries.map((e) => e.muscle_group))).join(' · ');
          return (
            <View key={date} style={{ marginBottom: 20 }}>
              <View style={styles.dateHeader}>
                <Calendar size={14} color={COLORS.brass} />
                <Text style={styles.dateLabel}>{formatDateHuman(date)}</Text>
                <View style={styles.dateLine} />
                <Text style={styles.dateGroups}>{groups}</Text>
              </View>

              {dayEntries.map((e) => {
                const maxKg = Math.max(...e.sets.map((s) => s.weight));
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
                    <TouchableOpacity onPress={() => removeEntry(e.id)} style={{ padding: 4 }}>
                      <Trash2 size={15} color={COLORS.chalkDim} />
                    </TouchableOpacity>
                  </View>
                );
              })}
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
  });
