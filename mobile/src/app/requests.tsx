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
import { Request } from '@/types';
import { Colors, Spacing } from '@/constants/theme';
import { Plus, Eye, X, AlertCircle } from 'lucide-react-native';

export default function RequestsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const isDark = scheme === 'dark';

  const { role } = useAuth();
  const isAdminOrManager = role === 'ADMIN' || role === 'INVENTORY_MANAGER';

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Request Modal state
  const [newModalVisible, setNewModalVisible] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('COMPONENT_REQUEST');
  const [formPriority, setFormPriority] = useState('MEDIUM');
  const [formDesc, setFormDesc] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  
  // Single request item addition state (supporting multiple items request list)
  const [reqItems, setReqItems] = useState<{ itemName: string; quantity: number; notes: string }[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');

  // Details Modal state (for viewing/approving requests)
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReq, setSelectedReq] = useState<Request | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingAction, setSavingAction] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await api.getRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load requests', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleAddItemToRequestList = () => {
    if (!newItemName.trim()) return;
    const qty = parseInt(newItemQty);
    if (isNaN(qty) || qty < 1) return;

    setReqItems([...reqItems, { itemName: newItemName.trim(), quantity: qty, notes: '' }]);
    setNewItemName('');
    setNewItemQty('1');
  };

  const handleCreateRequest = async () => {
    if (!formTitle.trim()) {
      setModalError('Request Title is required');
      return;
    }
    if (reqItems.length === 0) {
      setModalError('At least one item must be added to the request');
      return;
    }

    setSavingAction(true);
    setModalError('');
    try {
      await api.createRequest({
        title: formTitle.trim(),
        type: formType,
        priority: formPriority,
        description: formDesc.trim(),
        deadline: formDeadline || null,
        inspirationLinks: [],
        items: reqItems.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          notes: item.notes,
        }))
      });
      setNewModalVisible(false);
      setFormTitle('');
      setFormDesc('');
      setFormDeadline('');
      setReqItems([]);
      loadRequests();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSavingAction(false);
    }
  };

  const handleOpenDetail = (req: Request) => {
    setSelectedReq(req);
    setAdminNotes(req.adminNotes || '');
    setModalError('');
    setDetailModalVisible(true);
  };

  const handleUpdateStatus = async (status: 'APPROVED' | 'REJECTED' | 'COMPLETED') => {
    if (!selectedReq) return;
    
    setSavingAction(true);
    setModalError('');
    try {
      await api.updateRequestStatus(selectedReq.id, {
        status,
        adminNotes: adminNotes.trim(),
      });
      setDetailModalVisible(false);
      loadRequests();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to update request');
    } finally {
      setSavingAction(false);
    }
  };

  const renderRequest = ({ item }: { item: Request }) => {
    // Badges setup
    const isApproved = item.status === 'APPROVED';
    const isRejected = item.status === 'REJECTED';
    const isCompleted = item.status === 'COMPLETED';

    let statusColor = '#d97706'; // Yellow pending
    let statusBg = isDark ? '#d9770620' : '#fef3c7';
    if (isApproved) {
      statusColor = '#16a34a';
      statusBg = isDark ? '#16a34a20' : '#f0fdf4';
    } else if (isRejected) {
      statusColor = '#dc2626';
      statusBg = isDark ? '#dc262620' : '#fef2f2';
    } else if (isCompleted) {
      statusColor = '#2563eb';
      statusBg = isDark ? '#2563eb20' : '#eff6ff';
    }

    let priorityColor = '#64748b';
    if (item.priority === 'HIGH') priorityColor = '#dc2626';
    else if (item.priority === 'MEDIUM') priorityColor = '#ea580c';

    return (
      <Pressable 
        onPress={() => handleOpenDetail(item)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected, opacity: pressed ? 0.9 : 1 }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
              {item.type.replace('_', ' ')} • {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {isAdminOrManager ? (
            <Text style={[styles.userText, { color: colors.textSecondary }]}>
              By: {item.user?.username || 'Unknown'}
            </Text>
          ) : (
            <View />
          )}
          <View style={[styles.prioBadge, { backgroundColor: priorityColor + '20' }]}>
            <Text style={[styles.prioText, { color: priorityColor }]}>{item.priority} Priority</Text>
          </View>
        </View>
      </Pressable>
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
      
      {/* Header controls */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Inventory Requests ({requests.length})
        </Text>
        {!isAdminOrManager ? (
          <Pressable 
            onPress={() => {
              setModalError('');
              setFormTitle('');
              setFormDesc('');
              setFormDeadline('');
              setReqItems([]);
              setNewModalVisible(true);
            }} 
            style={({ pressed }) => [
              styles.addBtn,
              { opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Plus size={16} color="#fff" />
            <Text style={styles.addText}>New Request</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#185FA5" />
        }
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No requests yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {isAdminOrManager 
                ? 'There are currently no component checkout requests pending.' 
                : 'Click "New Request" to request items for your projects.'
              }
            </Text>
          </View>
        }
      />

      {/* Details View / Approval Modal */}
      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundElement }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Request Details</Text>
              <Pressable onPress={() => setDetailModalVisible(false)}>
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            {selectedReq ? (
              <ScrollView style={styles.modalBody}>
                {modalError ? (
                  <View style={styles.errorBox}>
                    <AlertCircle size={16} color="#dc2626" />
                    <Text style={styles.errorText}>{modalError}</Text>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Title</Text>
                  <Text style={[styles.detailVal, { color: colors.text }]}>{selectedReq.title}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type & Status</Text>
                  <Text style={[styles.detailVal, { color: colors.text }]}>
                    {selectedReq.type.replace('_', ' ')} • {selectedReq.status}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Description</Text>
                  <Text style={[styles.detailVal, { color: colors.text }]}>
                    {selectedReq.description || 'No description provided.'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Deadline</Text>
                  <Text style={[styles.detailVal, { color: colors.text }]}>
                    {selectedReq.deadline ? new Date(selectedReq.deadline).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>

                {/* Requested items listing */}
                <View style={[styles.itemsSection, { borderTopColor: colors.backgroundElement }]}>
                  <Text style={[styles.itemsTitle, { color: colors.text }]}>Requested Items</Text>
                  {selectedReq.items && selectedReq.items.length > 0 ? (
                    <View style={styles.itemsList}>
                      {selectedReq.items.map(item => (
                        <View key={item.id} style={styles.itemRow}>
                          <Text style={[styles.bullet, { color: '#185FA5' }]}>•</Text>
                          <Text style={[styles.itemText, { color: colors.text }]}>
                            {item.quantity}x {item.itemName} {item.notes ? `(${item.notes})` : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.noItemsText, { color: colors.textSecondary }]}>No items requested.</Text>
                  )}
                </View>

                {/* Admin notes edit/display */}
                <View style={[styles.adminSection, { borderTopColor: colors.backgroundElement }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Admin / Manager Notes</Text>
                  {isAdminOrManager && selectedReq.status === 'PENDING' ? (
                    <TextInput
                      style={[styles.formInput, styles.descInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                      value={adminNotes}
                      onChangeText={setAdminNotes}
                      placeholder="Add approval notes or reason for rejection..."
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={3}
                    />
                  ) : (
                    <Text style={[styles.adminNotesVal, { color: colors.text }]}>
                      {selectedReq.adminNotes || 'No notes added.'}
                    </Text>
                  )}
                </View>
              </ScrollView>
            ) : null}

            {selectedReq && isAdminOrManager && selectedReq.status === 'PENDING' ? (
              <View style={[styles.modalFooter, { borderTopColor: colors.backgroundElement, backgroundColor: colors.backgroundElement }]}>
                <Pressable 
                  onPress={() => handleUpdateStatus('REJECTED')} 
                  style={[styles.modalCancelBtn, { backgroundColor: '#dc262620', marginRight: 'auto' }]}
                >
                  <Text style={[styles.modalCancelText, { color: '#dc2626' }]}>Reject</Text>
                </Pressable>
                <Pressable 
                  onPress={() => handleUpdateStatus('APPROVED')} 
                  style={styles.modalSaveBtn}
                >
                  <Text style={styles.modalSaveText}>Approve</Text>
                </Pressable>
              </View>
            ) : selectedReq && isAdminOrManager && selectedReq.status === 'APPROVED' ? (
              <View style={[styles.modalFooter, { borderTopColor: colors.backgroundElement, backgroundColor: colors.backgroundElement }]}>
                <Pressable 
                  onPress={() => handleUpdateStatus('COMPLETED')} 
                  style={[styles.modalSaveBtn, { width: '100%' }]}
                >
                  <Text style={styles.modalSaveText}>Mark Completed</Text>
                </Pressable>
              </View>
            ) : (
              <View style={[styles.modalFooter, { borderTopColor: colors.backgroundElement, backgroundColor: colors.backgroundElement }]}>
                <Pressable onPress={() => setDetailModalVisible(false)} style={[styles.modalSaveBtn, { width: '100%', backgroundColor: colors.text }]}>
                  <Text style={[styles.modalSaveText, { color: colors.background }]}>Close</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Request Modal */}
      <Modal
        visible={newModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundElement }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Request</Text>
              <Pressable onPress={() => setNewModalVisible(false)}>
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
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Request Title *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="e.g. Quadcopter Build Phase 1"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Type</Text>
                  <View style={[styles.selectBox, { borderColor: colors.backgroundSelected }]}>
                    {['COMPONENT_REQUEST', 'PROJECT_REQUEST'].map(type => (
                      <Pressable 
                        key={type}
                        onPress={() => setFormType(type)}
                        style={[
                          styles.selectPill,
                          formType === type ? { backgroundColor: '#185FA5' } : { backgroundColor: colors.backgroundElement }
                        ]}
                      >
                        <Text style={[styles.selectPillText, { color: formType === type ? '#fff' : colors.text }]}>
                          {type === 'COMPONENT_REQUEST' ? 'Component' : 'Project'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Priority</Text>
                  <View style={[styles.selectBox, { borderColor: colors.backgroundSelected }]}>
                    {['LOW', 'MEDIUM', 'HIGH'].map(prio => (
                      <Pressable 
                        key={prio}
                        onPress={() => setFormPriority(prio)}
                        style={[
                          styles.selectPill,
                          formPriority === prio ? { backgroundColor: '#185FA5' } : { backgroundColor: colors.backgroundElement }
                        ]}
                      >
                        <Text style={[styles.selectPillText, { color: formPriority === prio ? '#fff' : colors.text }]}>
                          {prio}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Required Date / Deadline</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={formDeadline}
                  onChangeText={setFormDeadline}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Notes / Reason</Text>
                <TextInput
                  style={[styles.formInput, styles.descInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  multiline
                  numberOfLines={3}
                  value={formDesc}
                  onChangeText={setFormDesc}
                  placeholder="Describe why these components are needed..."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* Items assembly list */}
              <View style={[styles.itemsSection, { borderTopColor: colors.backgroundElement, paddingTop: 12 }]}>
                <Text style={[styles.formLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Requested Items ({reqItems.length})</Text>
                
                {reqItems.map((item, idx) => (
                  <View key={idx} style={styles.itemRowAdded}>
                    <Text style={[styles.itemTextAdded, { color: colors.text }]}>
                      {item.quantity}x {item.itemName}
                    </Text>
                    <Pressable onPress={() => setReqItems(reqItems.filter((_, i) => i !== idx))}>
                      <X size={16} color="#dc2626" />
                    </Pressable>
                  </View>
                ))}

                <View style={styles.addItemForm}>
                  <TextInput
                    style={[styles.formInput, { flex: 2, color: colors.text, borderColor: colors.backgroundSelected }]}
                    placeholder="Item Name"
                    placeholderTextColor={colors.textSecondary}
                    value={newItemName}
                    onChangeText={setNewItemName}
                  />
                  <TextInput
                    style={[styles.formInput, { flex: 1, color: colors.text, borderColor: colors.backgroundSelected }]}
                    keyboardType="numeric"
                    placeholder="Qty"
                    placeholderTextColor={colors.textSecondary}
                    value={newItemQty}
                    onChangeText={setNewItemQty}
                  />
                  <Pressable onPress={handleAddItemToRequestList} style={styles.miniAddBtn}>
                    <Plus size={16} color="#fff" />
                  </Pressable>
                </View>
              </View>

            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.backgroundElement, backgroundColor: colors.backgroundElement }]}>
              <Pressable onPress={() => setNewModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleCreateRequest} 
                style={styles.modalSaveBtn}
                disabled={savingAction}
              >
                <Text style={styles.modalSaveText}>Submit</Text>
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  userText: {
    fontSize: 12,
  },
  prioBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  prioText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemsSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  itemsList: {
    gap: 6,
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
    fontSize: 13,
  },
  noItemsText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  adminSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
    marginBottom: Spacing.four,
    gap: 4,
  },
  adminNotesVal: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
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
    height: 60,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  itemRowAdded: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  itemTextAdded: {
    fontSize: 13,
    fontWeight: '500',
  },
  addItemForm: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  miniAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#185FA5',
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
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
