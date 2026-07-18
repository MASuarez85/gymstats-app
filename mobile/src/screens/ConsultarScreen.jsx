import { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bot, Send } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { consultAI } from '../api/client';

// Portado de la pestaña "consultar" de App.jsx: chat simple contra /ai/consult
// (respuestas cacheadas en Redis del lado del backend si la pregunta se repite).
export default function ConsultarScreen() {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); // [{question, answer, error}]
  const scrollRef = useRef(null);

  const submit = async () => {
    const question = query.trim();
    if (!question || loading) return;
    setLoading(true);
    setQuery('');
    const placeholder = { question, answer: null, error: null };
    setHistory((h) => [...h, placeholder]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const { answer } = await consultAI(question);
      setHistory((h) => h.map((item) => (item === placeholder ? { ...item, answer } : item)));
    } catch (err) {
      setHistory((h) => h.map((item) => (item === placeholder ? { ...item, error: err.message } : item)));
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.content}>
          {history.length === 0 && (
            <View style={styles.emptyState}>
              <Bot size={30} color={COLORS.brass} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyText}>Preguntame cómo hacer un ejercicio, técnica, errores comunes o qué músculo trabaja.</Text>
              <Text style={styles.emptyExample}>Ej: "¿Cómo hago correctamente un peso muerto?"</Text>
            </View>
          )}

          {history.map((item, i) => (
            <View key={i} style={{ marginBottom: 14 }}>
              <Text style={styles.questionBubble}>{item.question}</Text>
              <View style={styles.answerBubble}>
                {item.answer && <Text style={styles.answerText}>{item.answer}</Text>}
                {item.error && <Text style={{ color: COLORS.hazard }}>{item.error}</Text>}
                {!item.answer && !item.error && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color={COLORS.chalkDim} />
                    <Text style={{ color: COLORS.chalkDim }}>Pensando…</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submit}
            placeholder="Preguntá sobre un ejercicio…"
            placeholderTextColor={COLORS.chalkDim}
          />
          <TouchableOpacity
            onPress={submit}
            disabled={!query.trim() || loading}
            style={[styles.sendButton, { backgroundColor: query.trim() ? COLORS.hazard : COLORS.hazardDim }]}
          >
            <Send size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: 18, paddingBottom: 12 },
    emptyState: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 10 },
    emptyText: { textAlign: 'center', color: COLORS.chalkDim, fontSize: 13 },
    emptyExample: { marginTop: 6, fontSize: 12, fontStyle: 'italic', color: COLORS.chalkDim, textAlign: 'center' },
    questionBubble: {
      alignSelf: 'flex-end',
      backgroundColor: COLORS.hazardDim,
      color: COLORS.chalk,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      fontSize: 13,
      marginBottom: 8,
      overflow: 'hidden',
    },
    answerBubble: {
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 10,
      padding: 12,
    },
    answerText: { fontSize: 13, lineHeight: 19, color: COLORS.chalk },
    inputRow: {
      flexDirection: 'row',
      gap: 8,
      padding: 18,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: COLORS.line,
    },
    input: {
      flex: 1,
      backgroundColor: COLORS.surfaceRaised,
      borderWidth: 1,
      borderColor: COLORS.line,
      color: COLORS.chalk,
      borderRadius: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      fontSize: 15,
    },
    sendButton: { width: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  });
