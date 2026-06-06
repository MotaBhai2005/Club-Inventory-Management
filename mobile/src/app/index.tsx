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
import { Item, DashboardMetrics } from '@/types';
import { Colors, Spacing } from '@/constants/theme';
import { Search, Plus, Edit2, Trash2, Download, AlertCircle, X } from 'lucide-react-native';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function InventoryScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const isDark = scheme === 'dark';

  const { role } = useAuth();
  const isManagerOrAdmin = role === 'ADMIN' || role === 'INVENTORY_MANAGER';

  const [items, setItems] = useState<Item[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Add/Edit Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formName, setFormName] = useState('');
  const [formCat, setFormCat] = useState('');
  const [formQty, setFormQty] = useState('1');
  const [formDesc, setFormDesc] = useState('');
  const [formCond, setFormCond] = useState('Good');
  const [modalError, setModalError] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const iRes = await api.getInventory();
      setItems(iRes);

      if (isManagerOrAdmin) {
        const mRes = await api.getMetrics();
        setMetrics(mRes);
      }
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormCat('Electronics');
    setFormQty('1');
    setFormDesc('');
    setFormCond('Good');
    setModalError('');
    setModalVisible(true);
  };

  const handleOpenEdit = (item: Item) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCat(item.cat);
    setFormQty(String(item.qty));
    setFormDesc(item.desc || '');
    setFormCond(item.cond || 'Good');
    setModalError('');
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This action is permanent.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteItem(id);
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  const handleSaveItem = async () => {
    if (!formName.trim()) {
      setModalError('Item Name is required');
      return;
    }
    const qtyNum = parseInt(formQty);
    if (isNaN(qtyNum) || qtyNum < 1) {
      setModalError('Quantity must be at least 1');
      return;
    }

    setModalSaving(true);
    setModalError('');
    const payload = {
      name: formName.trim(),
      cat: formCat,
      qty: qtyNum,
      desc: formDesc.trim(),
      cond: formCond,
    };

    try {
      if (editingItem) {
        await api.updateItem(editingItem.id, payload);
      } else {
        await api.addItem(payload);
      }
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to save item');
    } finally {
      setModalSaving(false);
    }
  };

  // Export to Excel using expo-sharing and expo-file-system
  const handleExportExcel = async () => {
    try {
      const data = filteredItems.map(item => ({
        "ID": item.id,
        "Item Name": item.name,
        "Category": item.cat,
        "Total Quantity": item.qty,
        "Available Quantity": item.availQty,
        "Lent Quantity": item.lentQty || 0,
        "Condition": item.cond || "Good",
        "Description": item.desc || ""
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

      const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      const fileName = `Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      const fileUri = (FileSystem as any).cacheDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Success", "Excel report saved locally in cache: " + fileName);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not generate or share Excel report.");
    }
  };

  const categories = ['All', ...Array.from(new Set(items.map(i => i.cat)))];

  const filteredItems = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || 
                          i.cat.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || i.cat === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const renderItem = ({ item }: { item: Item }) => {
    const isNeedsRepair = item.cond === 'Needs Repair';
    const isAvailable = (item.availQty ?? 0) > 0;
    
    let statusText = 'All Lent';
    let statusColor = '#d97706'; // Amber
    let statusBg = isDark ? '#d9770620' : '#fef3c7';

    if (isNeedsRepair) {
      statusText = 'Maintenance';
      statusColor = '#dc2626'; // Red
      statusBg = isDark ? '#dc262620' : '#fef2f2';
    } else if (isAvailable) {
      statusText = 'Available';
      statusColor = '#16a34a'; // Green
      statusBg = isDark ? '#16a34a20' : '#f0fdf4';
    }

    return (
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{item.desc || 'No description provided.'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusBg }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Category</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{item.cat}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Available</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{item.availQty} <Text style={styles.smallTotal}>/ {item.qty}</Text></Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Condition</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{item.cond || 'Good'}</Text>
          </View>
        </View>

        {isManagerOrAdmin ? (
          <View style={[styles.cardActions, { borderTopColor: colors.backgroundSelected }]}>
            <Pressable onPress={() => handleOpenEdit(item)} style={styles.actionBtn}>
              <Edit2 size={16} color="#185FA5" />
              <Text style={[styles.actionText, { color: '#185FA5' }]}>Edit</Text>
            </Pressable>
            <Pressable onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
              <Trash2 size={16} color="#dc2626" />
              <Text style={[styles.actionText, { color: '#dc2626' }]}>Delete</Text>
            </Pressable>
          </View>
        ) : null}
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
      
      {/* Search and Category filters */}
      <View style={styles.headerControls}>
        <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search items..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {categories.map(cat => (
            <Pressable 
              key={cat} 
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.catBtn,
                { backgroundColor: selectedCategory === cat ? '#185FA5' : colors.backgroundElement },
                selectedCategory === cat ? null : { borderColor: colors.backgroundSelected, borderWidth: 1 }
              ]}
            >
              <Text style={[
                styles.catText, 
                { color: selectedCategory === cat ? '#ffffff' : colors.text }
              ]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Metrics for Manager/Admin */}
      {isManagerOrAdmin && metrics ? (
        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Unique Items</Text>
            <Text style={[styles.metricVal, { color: colors.text }]}>{metrics.uniqueItems}</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Units</Text>
            <Text style={[styles.metricVal, { color: colors.text }]}>{metrics.totalUnits}</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Active Lent</Text>
            <Text style={[styles.metricVal, { color: colors.text }]}>{metrics.activeLendings}</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Overdue</Text>
            <Text style={[styles.metricVal, { color: metrics.overdue > 0 ? '#dc2626' : colors.text }]}>{metrics.overdue}</Text>
          </View>
        </View>
      ) : null}

      {/* Primary Actions */}
      <View style={styles.actionsBar}>
        <Text style={[styles.listTitle, { color: colors.text }]}>
          {isManagerOrAdmin ? 'Manage Items' : 'Available Items'} ({filteredItems.length})
        </Text>
        <View style={styles.actionsRight}>
          {isManagerOrAdmin ? (
            <Pressable onPress={handleExportExcel} style={styles.circleBtn}>
              <Download size={18} color={colors.text} />
            </Pressable>
          ) : null}
          {isManagerOrAdmin ? (
            <Pressable onPress={handleOpenAdd} style={[styles.circleBtn, { backgroundColor: '#185FA5' }]}>
              <Plus size={18} color="#ffffff" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Flat List */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#185FA5" />
        }
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No items found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Try altering your search text or selected category filters.
            </Text>
          </View>
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
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {modalError ? (
                <View style={styles.modalErrorBox}>
                  <AlertCircle size={16} color="#dc2626" />
                  <Text style={styles.modalErrorText}>{modalError}</Text>
                </View>
              ) : null}

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Item Name *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. Arduino Uno R3"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Category *</Text>
                <View style={[styles.selectBox, { borderColor: colors.backgroundSelected }]}>
                  {['Electronics', 'Hardware', 'Accessories', 'Tools', 'Sensors', 'Cables & Connectors'].map(c => (
                    <Pressable 
                      key={c}
                      onPress={() => setFormCat(c)}
                      style={[
                        styles.selectPill,
                        formCat === c ? { backgroundColor: '#185FA5' } : { backgroundColor: colors.backgroundElement }
                      ]}
                    >
                      <Text style={[styles.selectPillText, { color: formCat === c ? '#fff' : colors.text }]}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Total Quantity *</Text>
                  <TextInput
                    style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                    keyboardType="numeric"
                    value={formQty}
                    onChangeText={setFormQty}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Condition</Text>
                  <View style={[styles.selectBox, { borderColor: colors.backgroundSelected }]}>
                    {['Good', 'Fair', 'Needs Repair'].map(cond => (
                      <Pressable 
                        key={cond}
                        onPress={() => setFormCond(cond)}
                        style={[
                          styles.selectPill,
                          formCond === cond ? { backgroundColor: '#185FA5' } : { backgroundColor: colors.backgroundElement }
                        ]}
                      >
                        <Text style={[styles.selectPillText, { color: formCond === cond ? '#fff' : colors.text }]}>{cond}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Description / Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.descInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  multiline
                  numberOfLines={4}
                  value={formDesc}
                  onChangeText={setFormDesc}
                  placeholder="Specs, location..."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.backgroundElement, backgroundColor: colors.backgroundElement }]}>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleSaveItem} 
                style={[styles.modalSaveBtn, { opacity: modalSaving ? 0.8 : 1 }]}
                disabled={modalSaving}
              >
                {modalSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Item</Text>
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
  headerControls: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  catScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    justifyContent: 'center',
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '700',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionsRight: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff0f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff1f',
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
  itemName: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  infoCol: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  smallTotal: {
    fontSize: 10,
    fontWeight: '400',
    opacity: 0.7,
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
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc262610',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  modalErrorText: {
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
