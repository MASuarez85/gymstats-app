import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Camera, Check, X, Plus, Calendar, TrendingUp, Dumbbell, Loader2, ChevronRight, ChevronLeft, Trash2, MessageCircle, Send, Bot, Download, ExternalLink, ListChecks } from 'lucide-react';

const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Glúteos', 'Cardio'];

const MUSCLE_COLORS = {
  Pecho: '#FA114F',
  Espalda: '#FF9F0A',
  Piernas: '#A2E834',
  Hombros: '#0AF6F1',
  Brazos: '#BF5AF2',
  Core: '#FFD60A',
  Glúteos: '#FF6482',
  Cardio: '#64D2FF',
};

const COLORS = {
  bg: '#000000',
  surface: '#1C1C1E',
  surfaceRaised: '#2C2C2E',
  chalk: '#FFFFFF',
  chalkDim: '#8E8E93',
  hazard: '#FA114F',
  hazardDim: '#4A0F22',
  brass: '#A2E834',
  stand: '#0AF6F1',
  line: 'rgba(255,255,255,0.09)',
};

const FONTS = `
@font-face { font-family: 'SFRounded'; src: local('SF Pro Rounded'); }
`;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function toLocalISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayISO() {
  return toLocalISO(new Date());
}

function formatDateHuman(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });
}

// Convierte entries del formato viejo (weight/sets/reps uniformes) al nuevo (array de sets independientes)
function migrateEntry(e) {
  if (Array.isArray(e.sets)) return e;
  const count = Number(e.sets) || 1;
  const setsArr = Array.from({ length: count }).map(() => ({ weight: e.weight, reps: e.reps }));
  return { ...e, sets: setsArr };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Small plate-stack visual: represents the heaviest set as stacked barbell plates
function PlateStack({ kg }) {
  const plates = Math.max(1, Math.min(8, Math.round(kg / 15) || 1));
  const widths = [34, 30, 26, 22, 18, 15, 12, 10];
  return (
    <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 2, height: 46, justifyContent: 'flex-end' }}>
      {Array.from({ length: plates }).map((_, i) => (
        <div
          key={i}
          style={{
            width: widths[i] || 10,
            height: 5,
            borderRadius: 2,
            background: i === plates - 1 ? COLORS.hazard : COLORS.brass,
            opacity: 0.55 + (i / plates) * 0.45,
          }}
        />
      ))}
    </div>
  );
}

// Anillos de actividad estilo Apple Fitness: cada uno recibe un valor 0-1
function ActivityRings({ move, exercise, stand, size = 116 }) {
  const rings = [
    { r: 42, pct: move, color: COLORS.hazard },
    { r: 32, pct: exercise, color: COLORS.brass },
    { r: 22, pct: stand, color: COLORS.stand },
  ];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {rings.map((ring, i) => {
        const circumference = 2 * Math.PI * ring.r;
        const clamped = Math.min(1, Math.max(0, ring.pct));
        return (
          <g key={i}>
            <circle cx="50" cy="50" r={ring.r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={ring.r} fill="none" stroke={ring.color} strokeWidth="8"
              strokeDasharray={`${clamped * circumference} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          </g>
        );
      })}
    </svg>
  );
}

function StampBadge({ show }) {
  if (!show) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', alignItems: 'center', gap: 8,
        color: '#fff',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: 16,
        padding: '10px 18px',
        borderRadius: 999,
        background: COLORS.brass,
        pointerEvents: 'none',
        animation: 'stampIn 0.4s cubic-bezier(.2,1.4,.4,1)',
        zIndex: 20,
        whiteSpace: 'nowrap',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <Check size={18} strokeWidth={3} color="#000" />
      <span style={{ color: '#000' }}>Registrado</span>
    </div>
  );
}

function icsDate(dateISO) {
  return dateISO.replace(/-/g, '');
}

function icsDateTime(dateISO, time) {
  return `${icsDate(dateISO)}T${time.replace(':', '')}00`;
}

function buildICS({ title, dateISO, description, startTime, endTime }) {
  const dtStart = icsDateTime(dateISO, startTime);
  const dtEnd = icsDateTime(dateISO, endTime);
  const stamp = icsDateTime(dateISO, startTime);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GymStats//ES',
    'BEGIN:VEVENT',
    `UID:${uid()}@gymstats`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function eventDataFromEntries(entryList) {
  const groupsList = Array.from(new Set(entryList.map((e) => e.muscle_group))).join(', ');
  return {
    title: `Entrenamiento: ${groupsList}`,
    description: entryList.map((e) => `${e.exercise}: ${e.sets.map((s) => `${s.weight}kg x${s.reps}`).join(', ')}`).join('\n'),
  };
}

function eventDataFromPlan(muscleGroup) {
  return {
    title: `Entrenamiento planificado: ${muscleGroup}`,
    description: `Grupo muscular planificado: ${muscleGroup}`,
  };
}

function downloadICS({ title, description }, dateISO, startTime, endTime) {
  const ics = buildICS({ title, dateISO, description: description.replace(/\n/g, '\\n'), startTime, endTime });
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gymstats-${dateISO}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function googleCalendarLink({ title, description }, dateISO, startTime, endTime) {
  const start = icsDateTime(dateISO, startTime);
  const end = icsDateTime(dateISO, endTime);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

async function askExerciseAI(question) {
  const response = await fetch('/api/consult', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) throw new Error('No se pudo consultar (' + response.status + ')');
  const data = await response.json();
  return data.answer;
}


async function analyzePhoto(base64Image) {
  const response = await fetch('/api/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });
  if (!response.ok) throw new Error('No se pudo analizar la imagen (' + response.status + ')');
  return response.json();
}

async function analyzeRoutinePhoto(base64Image) {
  const response = await fetch('/api/routine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });
  if (!response.ok) throw new Error('No se pudo leer la rutina (' + response.status + ')');
  return response.json();
}

export default function WorkoutTracker() {
  const [tab, setTab] = useState('registrar');
  const [entries, setEntries] = useState([]);
  const [dayPlans, setDayPlans] = useState({}); // { 'YYYY-MM-DD': 'Pecho' }
  const [routines, setRoutines] = useState([]); // [{ id, name, exercises: [{id, name, muscle_group, targetSets, targetReps}] }]
  const [routineAssignments, setRoutineAssignments] = useState({}); // { 'YYYY-MM-DD': routineId }
  const [routineProgress, setRoutineProgress] = useState({}); // { 'YYYY-MM-DD': { exerciseId: true } }
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [pendingConflict, setPendingConflict] = useState(null); // { entry, plannedGroup, detectedGroup }

  // capture flow state
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [draft, setDraft] = useState(null); // { exercise, muscle_group, weight, sets, reps, confidence, date }
  const [showStamp, setShowStamp] = useState(false);
  const fileInputRef = useRef(null);

  // consulta IA
  const [consultQuery, setConsultQuery] = useState('');
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultHistory, setConsultHistory] = useState([]); // {question, answer, error}

  // constructor de rutinas
  const [routineBuilderOpen, setRoutineBuilderOpen] = useState(false);
  const [routineDraft, setRoutineDraft] = useState(null); // { id, name, exercises: [{id, name, muscle_group, targetSets, targetReps}] }
  const [routinePhotoAnalyzing, setRoutinePhotoAnalyzing] = useState(false);
  const [routinePhotoError, setRoutinePhotoError] = useState(null);
  const routineFileInputRef = useRef(null);

  // calendario
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedCalDate, setSelectedCalDate] = useState(null);
  const [exportStartTime, setExportStartTime] = useState('08:00');
  const [exportEndTime, setExportEndTime] = useState('09:00');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('gymstats:entries');
      if (raw) setEntries(JSON.parse(raw).map(migrateEntry));
    } catch (e) {
      // sin datos guardados todavia
    }
    try {
      const rawPlans = localStorage.getItem('gymstats:dayPlans');
      if (rawPlans) setDayPlans(JSON.parse(rawPlans));
    } catch (e) {
      // sin datos guardados todavia
    }
    try {
      const rawRoutines = localStorage.getItem('gymstats:routines');
      if (rawRoutines) setRoutines(JSON.parse(rawRoutines));
    } catch (e) {
      // sin datos guardados todavia
    }
    try {
      const rawAssign = localStorage.getItem('gymstats:routineAssignments');
      if (rawAssign) setRoutineAssignments(JSON.parse(rawAssign));
    } catch (e) {
      // sin datos guardados todavia
    }
    try {
      const rawProgress = localStorage.getItem('gymstats:routineProgress');
      if (rawProgress) setRoutineProgress(JSON.parse(rawProgress));
    } catch (e) {
      // sin datos guardados todavia
    }
    setLoaded(true);
  }, []);

  const persist = useCallback(async (next) => {
    setEntries(next);
    try {
      localStorage.setItem('gymstats:entries', JSON.stringify(next));
    } catch (e) {
      setStorageError(true);
    }
  }, []);

  const persistPlans = useCallback(async (next) => {
    setDayPlans(next);
    try {
      localStorage.setItem('gymstats:dayPlans', JSON.stringify(next));
    } catch (e) {
      setStorageError(true);
    }
  }, []);

  const persistRoutines = useCallback(async (next) => {
    setRoutines(next);
    try {
      localStorage.setItem('gymstats:routines', JSON.stringify(next));
    } catch (e) {
      setStorageError(true);
    }
  }, []);

  const persistRoutineAssignments = useCallback(async (next) => {
    setRoutineAssignments(next);
    try {
      localStorage.setItem('gymstats:routineAssignments', JSON.stringify(next));
    } catch (e) {
      setStorageError(true);
    }
  }, []);

  const persistRoutineProgress = useCallback(async (next) => {
    setRoutineProgress(next);
    try {
      localStorage.setItem('gymstats:routineProgress', JSON.stringify(next));
    } catch (e) {
      setStorageError(true);
    }
  }, []);

  const resetCapture = () => {
    setPhotoBase64(null);
    setPhotoPreview(null);
    setAnalysisError(null);
    setDraft(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setAnalysisError(null);
    setDraft(null);
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setAnalyzing(true);
    try {
      const b64 = await fileToBase64(file);
      setPhotoBase64(b64);
      const result = await analyzePhoto(b64);
      setDraft({
        exercise: result.exercise || '',
        muscle_group: MUSCLE_GROUPS.includes(result.muscle_group) ? result.muscle_group : MUSCLE_GROUPS[0],
        confidence: result.confidence || 'media',
        setsList: [{ weight: '', reps: '' }],
        date: todayISO(),
      });
    } catch (err) {
      setAnalysisError(err.message || 'Error al analizar la foto');
      setDraft({
        exercise: '',
        muscle_group: MUSCLE_GROUPS[0],
        confidence: null,
        setsList: [{ weight: '', reps: '' }],
        date: todayISO(),
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const updateSetRow = (index, field, value) => {
    setDraft((d) => ({
      ...d,
      setsList: d.setsList.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const addSetRow = () => {
    setDraft((d) => ({ ...d, setsList: [...d.setsList, { weight: '', reps: '' }] }));
  };

  const removeSetRow = (index) => {
    setDraft((d) => ({ ...d, setsList: d.setsList.filter((_, i) => i !== index) }));
  };

  const validSets = (draft && draft.setsList
    ? draft.setsList.filter((s) => s.weight !== '' && s.reps !== '')
    : []
  ).map((s) => ({ weight: Number(s.weight), reps: Number(s.reps) }));

  const finalizeSave = async (entry, { updatePlan, planGroup } = {}) => {
    const next = [entry, ...entries];
    await persist(next);
    if (updatePlan) {
      await persistPlans({ ...dayPlans, [entry.date]: planGroup });
    }
    setShowStamp(true);
    setTimeout(() => setShowStamp(false), 1200);
    setTimeout(resetCapture, 600);
  };

  const saveEntry = async () => {
    if (!draft || !draft.exercise || validSets.length === 0) return;
    const entry = {
      id: uid(),
      exercise: draft.exercise,
      muscle_group: draft.muscle_group,
      sets: validSets,
      date: draft.date,
      createdAt: Date.now(),
    };
    const plannedGroup = dayPlans[entry.date];

    if (!plannedGroup) {
      // Sin plan declarado: se completa solo con el primer registro del día
      await finalizeSave(entry, { updatePlan: true, planGroup: entry.muscle_group });
      return;
    }
    if (plannedGroup === entry.muscle_group) {
      await finalizeSave(entry);
      return;
    }
    // Hay plan declarado y no coincide: preguntamos antes de guardar
    setPendingConflict({ entry, plannedGroup, detectedGroup: entry.muscle_group });
  };

  const resolveConflict = async (replace) => {
    if (!pendingConflict) return;
    const { entry, detectedGroup } = pendingConflict;
    await finalizeSave(entry, replace ? { updatePlan: true, planGroup: detectedGroup } : {});
    setPendingConflict(null);
  };

  const deleteEntry = async (id) => {
    const next = entries.filter((e) => e.id !== id);
    await persist(next);
  };

  // Precarga el formulario de Registrar directamente (sin foto), usado al tocar
  // "Cargar series" desde el checklist de una rutina en el Calendario.
  const startManualDraft = (exercise, muscle_group, date) => {
    setPhotoPreview(null);
    setPhotoBase64(null);
    setAnalysisError(null);
    setDraft({
      exercise,
      muscle_group: MUSCLE_GROUPS.includes(muscle_group) ? muscle_group : MUSCLE_GROUPS[0],
      confidence: null,
      setsList: [{ weight: '', reps: '' }],
      date: date || todayISO(),
    });
    setTab('registrar');
  };

  const submitConsult = async () => {
    const question = consultQuery.trim();
    if (!question || consultLoading) return;
    setConsultLoading(true);
    setConsultQuery('');
    const entryPlaceholder = { question, answer: null, error: null };
    setConsultHistory((h) => [...h, entryPlaceholder]);
    try {
      const answer = await askExerciseAI(question);
      setConsultHistory((h) => h.map((item) => (item === entryPlaceholder ? { ...item, answer } : item)));
    } catch (err) {
      setConsultHistory((h) => h.map((item) => (item === entryPlaceholder ? { ...item, error: err.message } : item)));
    } finally {
      setConsultLoading(false);
    }
  };

  // --- Constructor de rutinas ---
  const openNewRoutine = () => {
    setRoutinePhotoError(null);
    setRoutineDraft({ id: uid(), name: '', exercises: [{ id: uid(), name: '', muscle_group: MUSCLE_GROUPS[0], targetSets: 3, targetReps: 10 }] });
    setRoutineBuilderOpen(true);
  };

  const openEditRoutine = (routine) => {
    setRoutinePhotoError(null);
    setRoutineDraft(JSON.parse(JSON.stringify(routine)));
    setRoutineBuilderOpen(true);
  };

  const closeRoutineBuilder = () => {
    setRoutineBuilderOpen(false);
    setRoutineDraft(null);
    setRoutinePhotoError(null);
    if (routineFileInputRef.current) routineFileInputRef.current.value = '';
  };

  const updateRoutineExercise = (index, field, value) => {
    setRoutineDraft((d) => ({
      ...d,
      exercises: d.exercises.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)),
    }));
  };

  const addRoutineExerciseRow = () => {
    setRoutineDraft((d) => ({
      ...d,
      exercises: [...d.exercises, { id: uid(), name: '', muscle_group: MUSCLE_GROUPS[0], targetSets: 3, targetReps: 10 }],
    }));
  };

  const removeRoutineExerciseRow = (index) => {
    setRoutineDraft((d) => ({ ...d, exercises: d.exercises.filter((_, i) => i !== index) }));
  };

  const handleRoutinePhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setRoutinePhotoError(null);
    setRoutinePhotoAnalyzing(true);
    try {
      const b64 = await fileToBase64(file);
      const result = await analyzeRoutinePhoto(b64);
      setRoutineDraft((d) => ({
        id: d?.id || uid(),
        name: result.name || d?.name || '',
        exercises: (result.exercises || []).map((ex) => ({
          id: uid(),
          name: ex.name || '',
          muscle_group: MUSCLE_GROUPS.includes(ex.muscle_group) ? ex.muscle_group : MUSCLE_GROUPS[0],
          targetSets: Number(ex.targetSets) || 3,
          targetReps: Number(ex.targetReps) || 10,
        })),
      }));
    } catch (err) {
      setRoutinePhotoError(err.message || 'No se pudo leer la foto');
    } finally {
      setRoutinePhotoAnalyzing(false);
    }
  };

  const saveRoutine = async () => {
    if (!routineDraft || !routineDraft.name.trim()) return;
    const validExercises = routineDraft.exercises.filter((ex) => ex.name.trim());
    if (validExercises.length === 0) return;
    const cleaned = { ...routineDraft, name: routineDraft.name.trim(), exercises: validExercises };
    const exists = routines.some((r) => r.id === cleaned.id);
    const next = exists ? routines.map((r) => (r.id === cleaned.id ? cleaned : r)) : [...routines, cleaned];
    await persistRoutines(next);
    closeRoutineBuilder();
  };

  const deleteRoutine = async (id) => {
    await persistRoutines(routines.filter((r) => r.id !== id));
    // Des-asignamos esa rutina de cualquier día que la tuviera puesta
    const nextAssignments = { ...routineAssignments };
    Object.keys(nextAssignments).forEach((date) => {
      if (nextAssignments[date] === id) delete nextAssignments[date];
    });
    await persistRoutineAssignments(nextAssignments);
  };

  // --- Asignación y checklist de rutinas en el Calendario ---
  const assignRoutineToDate = async (dateISO, routineId) => {
    const next = { ...routineAssignments };
    if (routineId) next[dateISO] = routineId; else delete next[dateISO];
    await persistRoutineAssignments(next);
  };

  const toggleRoutineExerciseDone = async (dateISO, exerciseId) => {
    const dayProgress = { ...(routineProgress[dateISO] || {}) };
    dayProgress[exerciseId] = !dayProgress[exerciseId];
    await persistRoutineProgress({ ...routineProgress, [dateISO]: dayProgress });
  };

  // Semana actual (lunes a domingo) para los anillos de actividad
  const weekBounds = (() => {
    const now = new Date();
    const dow = now.getDay(); // 0=domingo
    const diffToMonday = dow === 0 ? 6 : dow - 1;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: toLocalISO(monday), end: toLocalISO(sunday) };
  })();
  const weekEntries = entries.filter((e) => e.date >= weekBounds.start && e.date <= weekBounds.end);
  const weekDaysTrained = new Set(weekEntries.map((e) => e.date)).size;
  const weekSets = weekEntries.reduce((sum, e) => sum + e.sets.length, 0);
  const weekMuscleGroups = new Set(weekEntries.map((e) => e.muscle_group)).size;
  const SET_GOAL = 15; // meta semanal de series, ajustable

  const grouped = entries.reduce((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  const calYear = calendarMonth.getFullYear();
  const calMonthIdx = calendarMonth.getMonth();
  const firstWeekday = new Date(calYear, calMonthIdx, 1).getDay(); // 0=domingo
  const daysInMonth = new Date(calYear, calMonthIdx + 1, 0).getDate();
  const calCells = [
    ...Array.from({ length: firstWeekday }).map(() => null),
    ...Array.from({ length: daysInMonth }).map((_, i) => i + 1),
  ];
  const monthLabel = calendarMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const pad2 = (n) => String(n).padStart(2, '0');
  const cellISO = (day) => `${calYear}-${pad2(calMonthIdx + 1)}-${pad2(day)}`;
  const selectedDayEntries = selectedCalDate ? (grouped[selectedCalDate] || []) : [];
  const selectedDayPlan = selectedCalDate ? dayPlans[selectedCalDate] : null;
  const selectedRoutineId = selectedCalDate ? routineAssignments[selectedCalDate] : null;
  const selectedRoutine = selectedRoutineId ? routines.find((r) => r.id === selectedRoutineId) : null;
  const selectedRoutineProgress = selectedCalDate ? (routineProgress[selectedCalDate] || {}) : {};
  const exportEventData = selectedDayEntries.length > 0
    ? eventDataFromEntries(selectedDayEntries)
    : (selectedDayPlan ? eventDataFromPlan(selectedDayPlan) : null);

  const exerciseNames = Array.from(new Set(entries.map((e) => e.exercise)));
  const [selectedExercise, setSelectedExercise] = useState(null);
  useEffect(() => {
    if (!selectedExercise && exerciseNames.length) setSelectedExercise(exerciseNames[0]);
  }, [exerciseNames.length]);

  const exerciseHistory = entries
    .filter((e) => e.exercise === selectedExercise)
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((e) => ({ date: e.date.slice(5), peso: Math.max(...e.sets.map((s) => s.weight)) }));

  const activeMuscleGroups = MUSCLE_GROUPS.filter((mg) => entries.some((e) => e.muscle_group === mg));
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);
  useEffect(() => {
    if (!selectedMuscleGroup && activeMuscleGroups.length) setSelectedMuscleGroup(activeMuscleGroups[0]);
  }, [activeMuscleGroups.length]);

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

  const muscleFreq = MUSCLE_GROUPS.map((mg) => ({
    grupo: mg,
    veces: entries.filter((e) => e.muscle_group === mg).length,
  })).filter((m) => m.veces > 0);

  const inputStyle = {
    width: '100%',
    background: COLORS.surfaceRaised,
    border: `1px solid ${COLORS.line}`,
    color: COLORS.chalk,
    borderRadius: 6,
    padding: '10px 12px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
    fontSize: 15,
    outline: 'none',
  };

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.chalk,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
        minHeight: '100dvh',
        height: '100dvh',
        maxWidth: 480,
        margin: '0 auto',
        borderRadius: 18,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${COLORS.line}`,
        position: 'relative',
      }}
    >
      <style>{FONTS}{`
        @keyframes stampIn {
          0% { transform: translate(-50%,-50%) rotate(-9deg) scale(1.8); opacity: 0; }
          70% { transform: translate(-50%,-50%) rotate(-9deg) scale(0.95); opacity: 1; }
          100% { transform: translate(-50%,-50%) rotate(-9deg) scale(1); opacity: 1; }
        }
        input:focus, select:focus { border-color: ${COLORS.hazard} !important; }
        ::-webkit-scrollbar { width: 0px; }
      `}</style>

      {pendingConflict && (
        <div
          style={{
            position: 'absolute', inset: 0, background: 'rgba(10,10,9,0.82)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div style={{
            background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12,
            padding: 20, maxWidth: 340,
          }}>
            <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', system-ui, sans-serif", fontSize: 16, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
              ¿Cambiar el plan del día?
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: COLORS.chalkDim, marginBottom: 18 }}>
              Tenías planificado <span style={{ color: COLORS.brass, fontWeight: 600 }}>{pendingConflict.plannedGroup}</span> para
              el {formatDateHuman(pendingConflict.entry.date)}, pero la foto detectó <span style={{ color: COLORS.hazard, fontWeight: 600 }}>{pendingConflict.detectedGroup}</span>.
              ¿Querés reemplazar el grupo planificado de ese día?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => resolveConflict(false)}
                style={{
                  flex: 1, background: COLORS.surfaceRaised, border: `1px solid ${COLORS.line}`, borderRadius: 8,
                  color: COLORS.chalk, fontSize: 13, padding: '10px 8px', cursor: 'pointer',
                }}
              >
                Mantener {pendingConflict.plannedGroup}
              </button>
              <button
                onClick={() => resolveConflict(true)}
                style={{
                  flex: 1, background: COLORS.hazard, border: 'none', borderRadius: 8,
                  color: '#fff', fontSize: 13, padding: '10px 8px', cursor: 'pointer', fontWeight: 600,
                }}
              >
                Reemplazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: '18px 20px 14px', borderBottom: `1px solid ${COLORS.line}`,
        paddingTop: 'calc(18px + env(safe-area-inset-top))',
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', system-ui, sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: -0.5 }}>
          Gym<span style={{ color: COLORS.hazard }}>Stats</span>
        </div>
        <div style={{ fontSize: 13, color: COLORS.chalkDim, marginTop: 2 }}>
          {loaded ? `${entries.reduce((sum, e) => sum + e.sets.length, 0)} sets registrados` : 'Cargando…'}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 18, overflowY: 'auto' }}>
        {tab === 'registrar' && (
          <div>
            {!photoPreview && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, background: COLORS.surface,
                borderRadius: 20, padding: '16px 18px', marginBottom: 16, border: `1px solid ${COLORS.line}`,
              }}>
                <ActivityRings
                  move={weekDaysTrained / 7}
                  exercise={weekSets / SET_GOAL}
                  stand={weekMuscleGroups / MUSCLE_GROUPS.length}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: COLORS.chalkDim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                    Esta semana
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: COLORS.hazard }} />
                    <span style={{ fontSize: 13 }}>{weekDaysTrained} de 7 días</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: COLORS.brass }} />
                    <span style={{ fontSize: 13 }}>{weekSets} de {SET_GOAL} series</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: COLORS.stand }} />
                    <span style={{ fontSize: 13 }}>{weekMuscleGroups} de {MUSCLE_GROUPS.length} grupos</span>
                  </div>
                </div>
              </div>
            )}

            {!photoPreview && (
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                  width: '100%',
                  height: 220,
                  background: COLORS.surface,
                  border: `2px dashed ${COLORS.line}`,
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  color: COLORS.chalkDim,
                }}
              >
                <Camera size={40} color={COLORS.brass} />
                <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', system-ui, sans-serif", fontSize: 16, letterSpacing: 1, color: COLORS.chalk, textTransform: 'uppercase' }}>
                  Fotografiá la máquina
                </div>
                <div style={{ fontSize: 12 }}>Se detecta el ejercicio automáticamente</div>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              style={{ display: 'none' }}
            />

            {(photoPreview || draft) && (
              <div style={{ position: 'relative' }}>
                {photoPreview && (
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: `1px solid ${COLORS.line}` }}>
                    <img src={photoPreview} alt="captura" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                    <button
                      onClick={resetCapture}
                      style={{
                        position: 'absolute', top: 8, right: 8, background: 'rgba(21,21,19,0.75)',
                        border: `1px solid ${COLORS.line}`, borderRadius: 20, width: 30, height: 30,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}
                    >
                      <X size={16} color={COLORS.chalk} />
                    </button>
                  </div>
                )}

                <StampBadge show={showStamp} />

                {!photoPreview && draft && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: COLORS.chalkDim }}>Carga manual</div>
                    <button onClick={resetCapture} style={{ background: 'none', border: 'none', color: COLORS.chalkDim, fontSize: 12, cursor: 'pointer' }}>
                      Cancelar
                    </button>
                  </div>
                )}

                {analyzing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: COLORS.brass, fontSize: 14 }}>
                    <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    Analizando máquina…
                  </div>
                )}

                {analysisError && (
                  <div style={{ marginTop: 12, fontSize: 13, color: COLORS.hazard }}>
                    {analysisError}. Cargá el ejercicio manualmente abajo.
                  </div>
                )}

                {draft && !analyzing && (
                  <div style={{ marginTop: photoPreview ? 16 : 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {draft.confidence && (
                      <div style={{ fontSize: 12, color: COLORS.chalkDim }}>
                        Confianza de detección: <span style={{ color: COLORS.brass, fontFamily: "'SF Mono', ui-monospace, Menlo, monospace" }}>{draft.confidence}</span>
                      </div>
                    )}
                    <div>
                      <label style={{ fontSize: 12, color: COLORS.chalkDim, display: 'block', marginBottom: 4 }}>Ejercicio</label>
                      <input
                        style={inputStyle}
                        value={draft.exercise}
                        onChange={(e) => setDraft({ ...draft, exercise: e.target.value })}
                        placeholder="Ej: Press de banca"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: COLORS.chalkDim, display: 'block', marginBottom: 4 }}>Grupo muscular</label>
                      <select
                        style={inputStyle}
                        value={draft.muscle_group}
                        onChange={(e) => setDraft({ ...draft, muscle_group: e.target.value })}
                      >
                        {MUSCLE_GROUPS.map((mg) => <option key={mg} value={mg}>{mg}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ display: 'flex', fontSize: 11, color: COLORS.chalkDim, marginBottom: 6, paddingLeft: 26 }}>
                        <div style={{ flex: 1 }}>Peso (kg)</div>
                        <div style={{ flex: 1 }}>Reps</div>
                        <div style={{ width: 28 }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {draft.setsList.map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 18, fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: 12, color: COLORS.brass, textAlign: 'center',
                            }}>{i + 1}</div>
                            <input
                              style={{ ...inputStyle, flex: 1 }}
                              type="number" inputMode="decimal" placeholder="0"
                              value={s.weight}
                              onChange={(e) => updateSetRow(i, 'weight', e.target.value)}
                            />
                            <select
                              style={{ ...inputStyle, flex: 1 }}
                              value={s.reps}
                              onChange={(e) => updateSetRow(i, 'reps', e.target.value)}
                            >
                              <option value="" disabled>Reps</option>
                              {[15, 12, 10, 8, 6].map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => removeSetRow(i)}
                              disabled={draft.setsList.length === 1}
                              style={{
                                width: 28, height: 36, background: 'none', border: 'none',
                                cursor: draft.setsList.length === 1 ? 'default' : 'pointer',
                                opacity: draft.setsList.length === 1 ? 0.25 : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <X size={15} color={COLORS.chalkDim} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={addSetRow}
                        style={{
                          marginTop: 10, background: 'none', border: `1px dashed ${COLORS.line}`, borderRadius: 6,
                          color: COLORS.brass, fontSize: 13, padding: '8px 12px', width: '100%', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <Plus size={14} /> Agregar serie
                      </button>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: COLORS.chalkDim, display: 'block', marginBottom: 4 }}>Fecha</label>
                      <input style={inputStyle} type="date" value={draft.date}
                        onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                    </div>
                    <button
                      onClick={saveEntry}
                      disabled={!draft.exercise || validSets.length === 0}
                      style={{
                        marginTop: 4,
                        background: draft.exercise && validSets.length > 0 ? COLORS.hazard : COLORS.hazardDim,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '12px 16px',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', system-ui, sans-serif",
                        fontWeight: 600,
                        fontSize: 15,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        cursor: draft.exercise && validSets.length > 0 ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      <Check size={18} /> Registrar {validSets.length > 1 ? `${validSets.length} series` : 'set'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {storageError && (
              <div style={{ marginTop: 12, fontSize: 12, color: COLORS.hazard }}>
                No se pudo guardar. Los datos podrían perderse al cerrar.
              </div>
            )}
          </div>
        )}

        {tab === 'historial' && (
          <div>
            {sortedDates.length === 0 && (
              <div style={{ textAlign: 'center', color: COLORS.chalkDim, padding: '40px 0', fontSize: 14 }}>
                Todavía no registraste entrenamientos.
              </div>
            )}
            {sortedDates.map((date) => (
              <div key={date} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Calendar size={14} color={COLORS.brass} />
                  <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', system-ui, sans-serif", fontSize: 14, textTransform: 'capitalize', letterSpacing: 0.5 }}>
                    {formatDateHuman(date)}
                  </div>
                  <div style={{ flex: 1, height: 1, background: COLORS.line }} />
                  <div style={{ fontSize: 11, color: COLORS.chalkDim, fontFamily: "'SF Mono', ui-monospace, Menlo, monospace" }}>
                    {Array.from(new Set(grouped[date].map((e) => e.muscle_group))).join(' · ')}
                  </div>
                </div>
                {grouped[date].map((e) => {
                  const maxKg = Math.max(...e.sets.map((s) => s.weight));
                  return (
                    <div key={e.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, background: COLORS.surface,
                      borderRadius: 10, padding: '10px 12px', marginBottom: 6, border: `1px solid ${COLORS.line}`,
                    }}>
                      <PlateStack kg={maxKg} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{e.exercise}</div>
                        <div style={{ fontSize: 11, color: COLORS.chalkDim, marginBottom: 4 }}>{e.muscle_group}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {e.sets.map((s, i) => (
                            <span key={i} style={{
                              fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: 11, color: COLORS.chalk,
                              background: COLORS.surfaceRaised, border: `1px solid ${COLORS.line}`,
                              borderRadius: 4, padding: '2px 6px',
                            }}>
                              {s.weight}kg×{s.reps}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => deleteEntry(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <Trash2 size={15} color={COLORS.chalkDim} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {tab === 'calendario' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button
                onClick={() => setCalendarMonth(new Date(calYear, calMonthIdx - 1, 1))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
              >
                <ChevronLeft size={18} color={COLORS.chalkDim} />
              </button>
              <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', system-ui, sans-serif", fontSize: 15, letterSpacing: 0.5, textTransform: 'capitalize' }}>
                {monthLabel}
              </div>
              <button
                onClick={() => setCalendarMonth(new Date(calYear, calMonthIdx + 1, 1))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
              >
                <ChevronRight size={18} color={COLORS.chalkDim} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 10, color: COLORS.chalkDim, fontFamily: "'SF Mono', ui-monospace, Menlo, monospace" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {calCells.map((day, i) => {
                if (day === null) return <div key={i} />;
                const iso = cellISO(day);
                const hasEntries = !!grouped[iso];
                const plan = dayPlans[iso];
                const isSelected = selectedCalDate === iso;
                const isToday = iso === todayISO();
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedCalDate(isSelected ? null : iso)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 8,
                      border: isToday ? `1px solid ${COLORS.brass}` : `1px solid ${plan ? MUSCLE_COLORS[plan] : COLORS.line}`,
                      borderBottomWidth: plan ? 3 : 1,
                      background: isSelected ? COLORS.hazard : hasEntries ? COLORS.surfaceRaised : 'transparent',
                      color: isSelected ? '#fff' : COLORS.chalk,
                      fontFamily: "'SF Mono', ui-monospace, Menlo, monospace",
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                    }}
                  >
                    {day}
                    {hasEntries && !isSelected && <div style={{ width: 4, height: 4, borderRadius: 2, background: COLORS.hazard }} />}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {MUSCLE_GROUPS.filter((mg) => Object.values(dayPlans).includes(mg)).map((mg) => (
                <div key={mg} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: COLORS.chalkDim }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: MUSCLE_COLORS[mg] }} />
                  {mg}
                </div>
              ))}
            </div>

            {selectedCalDate && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', system-ui, sans-serif", fontSize: 13, textTransform: 'capitalize', color: COLORS.chalkDim, letterSpacing: 0.5 }}>
                    {formatDateHuman(selectedCalDate)}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: COLORS.chalkDim, display: 'block', marginBottom: 4 }}>
                    Grupo muscular planificado
                  </label>
                  <select
                    style={inputStyle}
                    value={dayPlans[selectedCalDate] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const next = { ...dayPlans };
                      if (val) next[selectedCalDate] = val; else delete next[selectedCalDate];
                      persistPlans(next);
                    }}
                  >
                    <option value="">Sin definir</option>
                    {MUSCLE_GROUPS.map((mg) => <option key={mg} value={mg}>{mg}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: COLORS.chalkDim, display: 'block', marginBottom: 4 }}>
                    Rutina asignada
                  </label>
                  <select
                    style={inputStyle}
                    value={selectedRoutineId || ''}
                    onChange={(e) => assignRoutineToDate(selectedCalDate, e.target.value || null)}
                  >
                    <option value="">Sin rutina</option>
                    {routines.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  {routines.length === 0 && (
                    <div style={{ fontSize: 11, color: COLORS.chalkDim, marginTop: 6 }}>
                      Todavía no creaste ninguna rutina. Andá a la pestaña Rutinas.
                    </div>
                  )}
                </div>

                {selectedRoutine && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: COLORS.chalkDim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      {selectedRoutine.name}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selectedRoutine.exercises.map((ex) => {
                        const done = !!selectedRoutineProgress[ex.id];
                        return (
                          <div key={ex.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10, background: COLORS.surface,
                            borderRadius: 12, padding: '10px 12px', border: `1px solid ${COLORS.line}`,
                            opacity: done ? 0.6 : 1,
                          }}>
                            <button
                              onClick={() => toggleRoutineExerciseDone(selectedCalDate, ex.id)}
                              style={{
                                width: 24, height: 24, borderRadius: 12, flexShrink: 0,
                                border: `2px solid ${done ? COLORS.brass : COLORS.chalkDim}`,
                                background: done ? COLORS.brass : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                              }}
                            >
                              {done && <Check size={14} strokeWidth={3} color="#000" />}
                            </button>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, textDecoration: done ? 'line-through' : 'none' }}>{ex.name}</div>
                              <div style={{ fontSize: 11, color: COLORS.chalkDim }}>
                                {ex.muscle_group} · {ex.targetSets}x{ex.targetReps}
                              </div>
                            </div>
                            <button
                              onClick={() => startManualDraft(ex.name, ex.muscle_group, selectedCalDate)}
                              style={{
                                fontSize: 11, background: COLORS.surfaceRaised, border: `1px solid ${COLORS.line}`,
                                borderRadius: 8, padding: '6px 10px', color: COLORS.chalk, cursor: 'pointer', whiteSpace: 'nowrap',
                              }}
                            >
                              Cargar series
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedDayEntries.length === 0 && (
                  <div style={{ fontSize: 13, color: COLORS.chalkDim, marginBottom: 14 }}>No entrenaste este día.</div>
                )}

                {selectedDayEntries.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    {selectedDayEntries.map((e) => (
                      <div key={e.id} style={{
                        background: COLORS.surface, borderRadius: 10, padding: '10px 12px',
                        marginBottom: 6, border: `1px solid ${COLORS.line}`,
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{e.exercise}</div>
                        <div style={{ fontSize: 11, color: COLORS.chalkDim, marginBottom: 4 }}>{e.muscle_group}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {e.sets.map((s, i) => (
                            <span key={i} style={{
                              fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: 11, color: COLORS.chalk,
                              background: COLORS.surfaceRaised, border: `1px solid ${COLORS.line}`,
                              borderRadius: 4, padding: '2px 6px',
                            }}>
                              {s.weight}kg×{s.reps}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {exportEventData && (
                  <div>
                    <label style={{ fontSize: 12, color: COLORS.chalkDim, display: 'block', marginBottom: 4 }}>
                      Horario para el calendario
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <input
                        type="time"
                        style={{ ...inputStyle, flex: 1 }}
                        value={exportStartTime}
                        onChange={(e) => setExportStartTime(e.target.value)}
                      />
                      <span style={{ color: COLORS.chalkDim, fontSize: 12 }}>a</span>
                      <input
                        type="time"
                        style={{ ...inputStyle, flex: 1 }}
                        value={exportEndTime}
                        onChange={(e) => setExportEndTime(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => downloadICS(exportEventData, selectedCalDate, exportStartTime, exportEndTime)}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          background: COLORS.surfaceRaised, border: `1px solid ${COLORS.line}`, borderRadius: 8,
                          color: COLORS.chalk, fontSize: 12, padding: '10px 8px', cursor: 'pointer',
                        }}
                      >
                        <Download size={14} /> Calendario iPhone
                      </button>
                      <a
                        href={googleCalendarLink(exportEventData, selectedCalDate, exportStartTime, exportEndTime)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          background: COLORS.surfaceRaised, border: `1px solid ${COLORS.line}`, borderRadius: 8,
                          color: COLORS.chalk, fontSize: 12, padding: '10px 8px', cursor: 'pointer', textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={14} /> Google Calendar
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'progreso' && (
          <div>
            {entries.length === 0 && (
              <div style={{ textAlign: 'center', color: COLORS.chalkDim, padding: '40px 0', fontSize: 14 }}>
                Registrá entrenamientos para ver tu progreso.
              </div>
            )}

            {muscleFreq.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', system-ui, sans-serif", fontSize: 14, letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase', color: COLORS.chalkDim }}>
                  Frecuencia por grupo muscular
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={muscleFreq}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} vertical={false} />
                    <XAxis dataKey="grupo" tick={{ fill: COLORS.chalkDim, fontSize: 10 }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
                    <YAxis tick={{ fill: COLORS.chalkDim, fontSize: 10 }} axisLine={{ stroke: COLORS.line }} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.line}`, borderRadius: 6, color: COLORS.chalk }} />
                    <Bar dataKey="veces" fill={COLORS.brass} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {exerciseNames.length > 0 && (
              <div>
                <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', system-ui, sans-serif", fontSize: 14, letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase', color: COLORS.chalkDim }}>
                  Evolución de peso
                </div>
                <select
                  style={{ ...inputStyle, marginBottom: 12 }}
                  value={selectedExercise || ''}
                  onChange={(e) => setSelectedExercise(e.target.value)}
                >
                  {exerciseNames.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={exerciseHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: COLORS.chalkDim, fontSize: 10 }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
                    <YAxis tick={{ fill: COLORS.chalkDim, fontSize: 10 }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
                    <Tooltip contentStyle={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.line}`, borderRadius: 6, color: COLORS.chalk }} />
                    <Line type="monotone" dataKey="peso" stroke={COLORS.hazard} strokeWidth={2.5} dot={{ fill: COLORS.hazard, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeMuscleGroups.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', system-ui, sans-serif", fontSize: 14, letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase', color: COLORS.chalkDim }}>
                  Evolución por grupo muscular
                </div>
                <select
                  style={{ ...inputStyle, marginBottom: 12 }}
                  value={selectedMuscleGroup || ''}
                  onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                >
                  {activeMuscleGroups.map((mg) => <option key={mg} value={mg}>{mg}</option>)}
                </select>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={muscleGroupHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: COLORS.chalkDim, fontSize: 10 }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
                    <YAxis tick={{ fill: COLORS.chalkDim, fontSize: 10 }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
                    <Tooltip contentStyle={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.line}`, borderRadius: 6, color: COLORS.chalk }} />
                    <Line type="monotone" dataKey="peso" stroke={COLORS.brass} strokeWidth={2.5} dot={{ fill: COLORS.brass, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {tab === 'consultar' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {consultHistory.length === 0 && (
              <div style={{ textAlign: 'center', color: COLORS.chalkDim, padding: '30px 10px', fontSize: 13 }}>
                <Bot size={30} color={COLORS.brass} style={{ marginBottom: 10 }} />
                <div>Preguntame cómo hacer un ejercicio, técnica, errores comunes o qué músculo trabaja.</div>
                <div style={{ marginTop: 6, fontSize: 12, fontStyle: 'italic' }}>Ej: "¿Cómo hago correctamente un peso muerto?"</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 12 }}>
              {consultHistory.map((item, i) => (
                <div key={i}>
                  <div style={{
                    alignSelf: 'flex-end', background: COLORS.hazardDim, color: COLORS.chalk, borderRadius: 10,
                    padding: '8px 12px', fontSize: 13, marginBottom: 8, display: 'inline-block',
                  }}>
                    {item.question}
                  </div>
                  <div style={{
                    background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10,
                    padding: '10px 12px', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  }}>
                    {item.answer && item.answer}
                    {item.error && <span style={{ color: COLORS.hazard }}>{item.error}</span>}
                    {!item.answer && !item.error && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: COLORS.chalkDim }}>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Pensando…
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={consultQuery}
                onChange={(e) => setConsultQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitConsult()}
                placeholder="Preguntá sobre un ejercicio…"
              />
              <button
                onClick={submitConsult}
                disabled={!consultQuery.trim() || consultLoading}
                style={{
                  background: consultQuery.trim() ? COLORS.hazard : COLORS.hazardDim,
                  border: 'none', borderRadius: 8, width: 44, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: consultQuery.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                <Send size={16} color="#fff" />
              </button>
            </div>
          </div>
        )}

        {tab === 'rutinas' && !routineBuilderOpen && (
          <div>
            <button
              onClick={openNewRoutine}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: COLORS.hazard, border: 'none', borderRadius: 14, padding: '14px 16px',
                color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16,
              }}
            >
              <Plus size={18} /> Nueva rutina
            </button>

            {routines.length === 0 && (
              <div style={{ textAlign: 'center', color: COLORS.chalkDim, padding: '30px 10px', fontSize: 13 }}>
                Todavía no armaste ninguna rutina. Podés cargarla a mano o sacarle una foto a tu plan de entrenamiento.
              </div>
            )}

            {routines.map((r) => {
              const groupsInRoutine = Array.from(new Set(r.exercises.map((ex) => ex.muscle_group)));
              return (
                <div key={r.id} style={{
                  background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 16,
                  padding: '14px 16px', marginBottom: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: COLORS.chalkDim, marginTop: 2 }}>
                        {r.exercises.length} ejercicios · {groupsInRoutine.join(', ')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => openEditRoutine(r)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: COLORS.chalkDim, fontSize: 12 }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteRoutine(r.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
                      >
                        <Trash2 size={15} color={COLORS.chalkDim} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {r.exercises.map((ex) => (
                      <span key={ex.id} style={{
                        fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: 11, color: COLORS.chalk,
                        background: COLORS.surfaceRaised, border: `1px solid ${COLORS.line}`,
                        borderRadius: 4, padding: '2px 6px',
                      }}>
                        {ex.name} · {ex.targetSets}x{ex.targetReps}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'rutinas' && routineBuilderOpen && routineDraft && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button onClick={closeRoutineBuilder} style={{ background: 'none', border: 'none', color: COLORS.chalkDim, fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {routines.some((r) => r.id === routineDraft.id) ? 'Editar rutina' : 'Nueva rutina'}
              </div>
              <div style={{ width: 60 }} />
            </div>

            <button
              onClick={() => routineFileInputRef.current && routineFileInputRef.current.click()}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: COLORS.surface, border: `1px dashed ${COLORS.line}`, borderRadius: 14,
                padding: '12px 16px', color: COLORS.brass, fontSize: 13, cursor: 'pointer', marginBottom: 16,
              }}
            >
              <Camera size={16} /> {routinePhotoAnalyzing ? 'Leyendo la foto…' : 'Completar desde una foto'}
            </button>
            <input
              ref={routineFileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleRoutinePhoto}
              style={{ display: 'none' }}
            />
            {routinePhotoError && (
              <div style={{ fontSize: 12, color: COLORS.hazard, marginBottom: 12 }}>{routinePhotoError}</div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: COLORS.chalkDim, display: 'block', marginBottom: 4 }}>Nombre de la rutina</label>
              <input
                style={inputStyle}
                value={routineDraft.name}
                onChange={(e) => setRoutineDraft({ ...routineDraft, name: e.target.value })}
                placeholder="Ej: Rutina Push"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              {routineDraft.exercises.map((ex, i) => (
                <div key={ex.id} style={{
                  background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      value={ex.name}
                      onChange={(e) => updateRoutineExercise(i, 'name', e.target.value)}
                      placeholder="Nombre del ejercicio"
                    />
                    <button
                      onClick={() => removeRoutineExerciseRow(i)}
                      disabled={routineDraft.exercises.length === 1}
                      style={{
                        width: 28, height: 36, background: 'none', border: 'none',
                        cursor: routineDraft.exercises.length === 1 ? 'default' : 'pointer',
                        opacity: routineDraft.exercises.length === 1 ? 0.25 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <X size={15} color={COLORS.chalkDim} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      style={{ ...inputStyle, flex: 1.4 }}
                      value={ex.muscle_group}
                      onChange={(e) => updateRoutineExercise(i, 'muscle_group', e.target.value)}
                    >
                      {MUSCLE_GROUPS.map((mg) => <option key={mg} value={mg}>{mg}</option>)}
                    </select>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      type="number" inputMode="numeric" placeholder="Series"
                      value={ex.targetSets}
                      onChange={(e) => updateRoutineExercise(i, 'targetSets', e.target.value)}
                    />
                    <select
                      style={{ ...inputStyle, flex: 1 }}
                      value={ex.targetReps}
                      onChange={(e) => updateRoutineExercise(i, 'targetReps', e.target.value)}
                    >
                      {[15, 12, 10, 8, 6].map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addRoutineExerciseRow}
              style={{
                width: '100%', background: 'none', border: `1px dashed ${COLORS.line}`, borderRadius: 10,
                color: COLORS.brass, fontSize: 13, padding: '10px 12px', cursor: 'pointer', marginBottom: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Plus size={14} /> Agregar ejercicio
            </button>

            <button
              onClick={saveRoutine}
              disabled={!routineDraft.name.trim() || !routineDraft.exercises.some((ex) => ex.name.trim())}
              style={{
                width: '100%',
                background: routineDraft.name.trim() ? COLORS.hazard : COLORS.hazardDim,
                color: '#fff', border: 'none', borderRadius: 14, padding: '14px 16px',
                fontWeight: 600, fontSize: 15,
                cursor: routineDraft.name.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Check size={18} /> Guardar rutina
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        display: 'flex', borderTop: `1px solid ${COLORS.line}`,
        background: 'rgba(28,28,30,0.78)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {[
          { key: 'registrar', label: 'Registrar', icon: Plus },
          { key: 'historial', label: 'Historial', icon: Dumbbell },
          { key: 'calendario', label: 'Calendario', icon: Calendar },
          { key: 'progreso', label: 'Progreso', icon: TrendingUp },
          { key: 'consultar', label: 'Consultar', icon: MessageCircle },
          { key: 'rutinas', label: 'Rutinas', icon: ListChecks },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '10px 0 8px', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: tab === key ? COLORS.hazard : COLORS.chalkDim,
            }}
          >
            <Icon size={19} strokeWidth={tab === key ? 2.4 : 1.8} />
            <span style={{ fontSize: 9, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif", letterSpacing: 0 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
