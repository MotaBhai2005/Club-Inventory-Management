import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  Pressable, 
  ActivityIndicator, 
  Modal, 
  ScrollView,
  useColorScheme,
  RefreshControl,
  Alert
} from 'react-native';
import { useAuth } from '@/components/AuthContext';
import * as api from '@/services/api';
import { User } from '@/types';
import { Colors, Spacing } from '@/constants/theme';
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react-native';

export default function UsersScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const isDark = scheme === 'dark';

  const { userId: currentUserId } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRegNum, setFormRegNum] = useState('');
  const [formRole, setFormRole] = useState('MEMBER');
  const [formPassword, setFormPassword] = useState('');
  
  const [modalError, setModalError] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormEmail('');
    setFormRegNum('');
    setFormRole('MEMBER');
    setFormPassword('');
    setModalError('');
    setModalVisible(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormRegNum(user.registrationNumber || '');
    setFormRole(user.role);
    setFormPassword(''); // blank unless they change password
    setModalError('');
    setModalVisible(true);
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUserId) {
      Alert.alert('Restricted', 'You cannot delete your own admin account while active.');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete account "${user.username}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteUser(user.id);
              loadUsers();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const handleSaveUser = async () => {
    if (!formUsername.trim() || !formEmail.trim()) {
      setModalError('Username and Email are required');
      return;
    }
    if (!editingUser && !formPassword.trim()) {
      setModalError('Password is required for new users');
      return;
    }

    setSavingUser(true);
    setModalError('');

    const payload: any = {
      username: formUsername.trim(),
      email: formEmail.trim(),
      registrationNumber: formRegNum.trim() || null,
      role: formRole,
    };
    if (formPassword.trim()) {
      payload.password = formPassword;
    }

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, payload);
      } else {
        await api.createUser(payload);
      }
      setModalVisible(false);
      loadUsers();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to save user account');
    } finally {
      setSavingUser(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    // Badges colors
    let roleBg = isDark ? '#ef444420' : '#fee2e2'; // Admin Red
    let roleColor = '#dc2626';

    if (item.role === 'INVENTORY_MANAGER') {
      roleBg = isDark ? '#3b82f620' : '#dbeafe'; // Manager Blue
      roleColor = '#1e40af';
    } else if (item.role === 'MEMBER') {
      roleBg = isDark ? '#64748b20' : '#f1f5f9'; // Member Slate
      roleColor = '#475569';
    }

    return (
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {item.username} {item.id === currentUserId ? '(You)' : ''}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
            {item.registrationNumber ? (
              <Text style={[styles.userReg, { color: colors.textSecondary }]}>
                Reg: {item.registrationNumber}
              </Text>
            ) : null}
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleBg }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>
              {item.role.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={[styles.cardActions, { borderTopColor: colors.backgroundSelected }]}>
          <Pressable onPress={() => handleOpenEdit(item)} style={styles.actionBtn}>
            <Edit2 size={15} color="#185FA5" />
            <Text style={[styles.actionText, { color: '#185FA5' }]}>Edit</Text>
          </Pressable>
          <Pressable onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <Trash2 size={15} color="#dc2626" />
            <Text style={[styles.actionText, { color: '#dc2626' }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#185FA5" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          User Accounts ({users.length})
        </Text>
        <Pressable 
          onPress={handleOpenAdd} 
          style={({ pressed }) => [
            styles.addBtn,
            { opacity: pressed ? 0.8 : 1 }
          ]}
        >
          <Plus size={16} color="#fff" />
          <Text style={styles.addText}>Add User</Text>
        </Pressable>
      </View>

      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#185FA5" />
        }
      />

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundElement }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingUser ? 'Edit User Account' : 'Create User Account'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {modalError ? (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color="#dc2626" />
                  <Text style={styles.errorText}>{modalError}</Text>
                </View>
              ) : null}

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Username *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={formUsername}
                  onChangeText={setFormUsername}
                  placeholder="e.g. johndoe"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Email Address *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={formEmail}
                  onChangeText={setFormEmail}
                  placeholder="e.g. john@robotics.org"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Registration Number</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={formRegNum}
                  onChangeText={setFormRegNum}
                  placeholder="e.g. 2026BCS0123"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Account Role</Text>
                <View style={[styles.selectBox, { borderColor: colors.backgroundSelected }]}>
                  {['MEMBER', 'INVENTORY_MANAGER', 'ADMIN'].map(roleOption => (
                    <Pressable 
                      key={roleOption}
                      onPress={() => setFormRole(roleOption)}
                      style={[
                        styles.selectPill,
                        formRole === roleOption ? { backgroundColor: '#185FA5' } : { backgroundColor: colors.backgroundElement }
                      ]}
                    >
                      <Text style={[styles.selectPillText, { color: formRole === roleOption ? '#fff' : colors.text }]}>
                        {roleOption.replace('_', ' ')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  {editingUser ? 'Change Password (Optional)' : 'Password *'}
                </Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={formPassword}
                  onChangeText={setFormPassword}
                  placeholder={editingUser ? 'Leave blank to keep current' : 'At least 6 characters'}
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.backgroundElement, backgroundColor: colors.backgroundElement }]}>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleSaveUser} 
                style={[styles.modalSaveBtn, { opacity: savingUser ? 0.8 : 1 }]}
                disabled={savingUser}
              >
                {savingUser ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save User</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#185FA5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  userReg: {
    fontSize: 11,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    marginTop: 4,
    justifyContent: 'flex-end',
    gap: Spacing.three,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    padding: Spacing.three,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc262610',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 16,
    gap: 6,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  formInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  selectBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 4,
  },
  selectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.three,
    borderTopWidth: 1,
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#185FA5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
