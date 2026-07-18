import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { UserCog, Settings, LogOut, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import Avatar from './Avatar';

export default function UserMenuModal({ visible, onClose, onEditProfile, onPreferences }) {
  const { user, logout } = useAuthContext();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const confirmLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  if (!visible) return null;

  const displayName = user?.displayName || user?.email || 'Usuario';
  const trial = user?.trial;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={() => {}}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={16} color={COLORS.chalkDim} />
          </TouchableOpacity>

          <View style={styles.identity}>
            <Avatar displayName={user?.displayName} email={user?.email} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
              {!!user?.email && <Text style={styles.email} numberOfLines={1}>{user.email}</Text>}
            </View>
          </View>

          {trial && (
            <View style={styles.trialBadge}>
              <Text style={styles.trialText}>
                {trial.subscribed
                  ? 'Suscripción activa'
                  : trial.active
                  ? `Prueba gratuita: ${trial.daysLeft} día${trial.daysLeft === 1 ? '' : 's'} restantes`
                  : 'Prueba gratuita finalizada'}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={onEditProfile}>
            <UserCog size={17} color={COLORS.chalk} />
            <Text style={styles.menuItemText}>Editar perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onPreferences}>
            <Settings size={17} color={COLORS.chalk} />
            <Text style={styles.menuItemText}>Preferencias</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={confirmLogout}>
            <LogOut size={17} color={COLORS.hazard} />
            <Text style={[styles.menuItemText, { color: COLORS.hazard }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(10,10,9,0.82)', alignItems: 'flex-end', padding: 16, paddingTop: 60 },
    card: {
      width: 260,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 14,
      padding: 16,
      gap: 10,
    },
    closeButton: { position: 'absolute', top: 10, right: 10, padding: 4 },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4, paddingRight: 16 },
    name: { color: COLORS.chalk, fontSize: 15, fontWeight: '600' },
    email: { color: COLORS.chalkDim, fontSize: 12, marginTop: 2 },
    trialBadge: {
      backgroundColor: COLORS.surfaceRaised,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginBottom: 4,
    },
    trialText: { color: COLORS.brass, fontSize: 11 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    menuItemText: { color: COLORS.chalk, fontSize: 14 },
  });
