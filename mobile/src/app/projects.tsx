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
  Image,
  Alert,
  Platform
} from 'react-native';
import { useAuth } from '@/components/AuthContext';
import * as api from '@/services/api';
import { Colors, Spacing } from '@/constants/theme';
import { Plus, Upload, Calendar, Clock, PackageSearch, X, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ProjectsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const isDark = scheme === 'dark';

  const { role } = useAuth();
  const canEdit = role === 'ADMIN' || role === 'INVENTORY_MANAGER';

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Project Form state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formStatus, setFormStatus] = useState('PLANNING');
  const [modalError, setModalError] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  // Add Item to Project state
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemNotes, setItemNotes] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProjects();
  };

  const handleCreateProject = async () => {
    if (!formName.trim()) {
      setModalError('Project Name is required');
      return;
    }

    setSavingProject(true);
    setModalError('');
    try {
      await api.createProject({
        name: formName.trim(),
        description: formDesc.trim(),
        startDate: formStart || null,
        endDate: formEnd || null,
        status: formStatus,
        isProject: true,
      });
      setCreateModalVisible(false);
      loadProjects();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSavingProject(false);
    }
  };

  const handleOpenAddItem = (projectId: number) => {
    setSelectedProjectId(projectId);
    setItemName('');
    setItemQty('1');
    setItemNotes('');
    setItemModalVisible(true);
  };

  const handleAddItemToProject = async () => {
    if (!itemName.trim() || !selectedProjectId) {
      return;
    }
    const qty = parseInt(itemQty);
    if (isNaN(qty) || qty < 1) {
      return;
    }

    setSavingItem(true);
    try {
      await api.addProjectItem(selectedProjectId, {
        itemName: itemName.trim(),
        quantity: qty,
        notes: itemNotes.trim(),
      });
      setItemModalVisible(false);
      loadProjects();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add item to project');
    } finally {
      setSavingItem(false);
    }
  };

  // Image Upload using expo-image-picker
  const handleUploadImage = async (projectId: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      try {
        setLoading(true);
        // Extracts filename from uri
        const uriParts = asset.uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        
        await api.uploadProjectImage(projectId, asset.uri, fileName);
        loadProjects();
        Alert.alert('Success', 'Project image uploaded successfully!');
      } catch (err: any) {
        Alert.alert('Error', err.response?.data?.error || 'Failed to upload image');
        setLoading(false);
      }
    }
  };

  const visibleProjects = projects.filter(p => p.isProject);

  const getBackendBase = () => {
    // Standard backend host address setup
    const defaultWeb = 'http://localhost:5000';
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000';
    }
    return defaultWeb;
  };

  const renderProject = ({ item }: { item: any }) => {
    const backendBase = getBackendBase();
    const imageUrl = item.imageUrl ? `${backendBase}${item.imageUrl}` : null;

    return (
      <View style={[styles.projectCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.projectImage} />
        ) : (
          <View style={[styles.projectImageFallback, { backgroundColor: colors.backgroundSelected }]}>
            <PackageSearch size={32} color={colors.textSecondary} />
            <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>No Project Image</Text>
          </View>
        )}

        <View style={styles.projectDetails}>
          <View style={styles.cardHeader}>
            <Text style={[styles.projectName, { color: colors.text }]}>{item.name}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>

          <Text style={[styles.projectDesc, { color: colors.textSecondary }]}>{item.description || 'No description.'}</Text>

          <View style={styles.dateRow}>
            <Calendar size={14} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>Start: {item.startDate || 'N/A'}</Text>
          </View>
          <View style={styles.dateRow}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>End: {item.endDate || 'N/A'}</Text>
          </View>

          {/* Bulk items list */}
          <View style={[styles.itemsSection, { borderTopColor: colors.backgroundSelected }]}>
            <Text style={[styles.itemsTitle, { color: colors.text }]}>Bulk Orders ({item.items?.length || 0})</Text>
            {item.items && item.items.length > 0 ? (
              <View style={styles.itemList}>
                {item.items.map((bulkItem: any) => (
                  <View key={bulkItem.id} style={styles.itemRow}>
                    <Text style={[styles.bullet, { color: '#185FA5' }]}>•</Text>
                    <Text style={[styles.itemText, { color: colors.text }]}>
                      {bulkItem.quantity}x {bulkItem.itemName}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.noItemsText, { color: colors.textSecondary }]}>No items ordered.</Text>
            )}
          </View>

          {canEdit ? (
            <View style={styles.managerActions}>
              <Pressable 
                onPress={() => handleOpenAddItem(item.id)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: '#185FA5', opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Plus size={14} color="#fff" />
                <Text style={styles.actionText}>Add Items</Text>
              </Pressable>
              <Pressable 
                onPress={() => handleUploadImage(item.id)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { borderColor: colors.textSecondary, borderWidth: 1, opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <Upload size={14} color={colors.text} />
                <Text style={[styles.actionText, { color: colors.text }]}>Image</Text>
              </Pressable>
            </View>
          ) : null}
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
      
      {/* Action Header bar */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Active Projects ({visibleProjects.length})
        </Text>
        {canEdit ? (
          <Pressable 
            onPress={() => setCreateModalVisible(true)} 
            style={({ pressed }) => [
              styles.addBtn,
              { opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Plus size={16} color="#fff" />
            <Text style={styles.addText}>New Project</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={visibleProjects}
        renderItem={renderProject}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#185FA5" />
        }
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No projects yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              There are currently no active bulk hardware orders or projects defined.
            </Text>
          </View>
        }
      />

      {/* New Project Modal */}
      <Modal
        visible={createModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundElement }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Project</Text>
              <Pressable onPress={() => setCreateModalVisible(false)}>
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
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Project Name *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. Quadcopter Drone"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Status</Text>
                <View style={[styles.selectBox, { borderColor: colors.backgroundSelected }]}>
                  {['PLANNING', 'IN PROGRESS', 'COMPLETED'].map(status => (
                    <Pressable 
                      key={status}
                      onPress={() => setFormStatus(status)}
                      style={[
                        styles.selectPill,
                        formStatus === status ? { backgroundColor: '#185FA5' } : { backgroundColor: colors.backgroundElement }
                      ]}
                    >
                      <Text style={[styles.selectPillText, { color: formStatus === status ? '#fff' : colors.text }]}>
                        {status}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Start Date</Text>
                  <TextInput
                    style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                    value={formStart}
                    onChangeText={setFormStart}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>End Date</Text>
                  <TextInput
                    style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                    value={formEnd}
                    onChangeText={setFormEnd}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.descInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  multiline
                  numberOfLines={4}
                  value={formDesc}
                  onChangeText={setFormDesc}
                  placeholder="Details about project objectives and scope..."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.backgroundElement, backgroundColor: colors.backgroundElement }]}>
              <Pressable onPress={() => setCreateModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleCreateProject} 
                style={[styles.modalSaveBtn, { opacity: savingProject ? 0.8 : 1 }]}
                disabled={savingProject}
              >
                {savingProject ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Create</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Item to Project Modal */}
      <Modal
        visible={itemModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setItemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundElement }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Item to Project</Text>
              <Pressable onPress={() => setItemModalVisible(false)}>
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Item Name *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={itemName}
                  onChangeText={setItemName}
                  placeholder="e.g. LiPo Battery 4S 5000mAh"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Quantity *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  keyboardType="numeric"
                  value={itemQty}
                  onChangeText={setItemQty}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.descInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  multiline
                  numberOfLines={2}
                  value={itemNotes}
                  onChangeText={setItemNotes}
                  placeholder="e.g. Required by motor test phase"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.backgroundElement, backgroundColor: colors.backgroundElement }]}>
              <Pressable onPress={() => setItemModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleAddItemToProject} 
                style={[styles.modalSaveBtn, { opacity: savingItem ? 0.8 : 1 }]}
                disabled={savingItem}
              >
                {savingItem ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Add Item</Text>
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
  projectCard: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: Spacing.three,
    overflow: 'hidden',
  },
  projectImage: {
    width: '100%',
    height: 160,
  },
  projectImageFallback: {
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  fallbackText: {
    fontSize: 12,
    fontWeight: '600',
  },
  projectDetails: {
    padding: Spacing.three,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectName: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#1e40af',
    fontSize: 10,
    fontWeight: '700',
  },
  projectDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
  },
  itemsSection: {
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    marginTop: 4,
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  itemList: {
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bullet: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemText: {
    fontSize: 12,
  },
  noItemsText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  managerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 6,
    gap: 6,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyView: {
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
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
  descInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
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
