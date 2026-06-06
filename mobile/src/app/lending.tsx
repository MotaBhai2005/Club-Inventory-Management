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
import * as api from '@/services/api';
import { Lending, Item } from '@/types';
import { Colors, Spacing } from '@/constants/theme';
import { Plus, PackagePlus, X, AlertCircle } from 'lucide-react-native';

export default function LendingScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const isDark = scheme === 'dark';

  const [lendings, setLendings] = useState<Lending[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Lending Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [formQty, setFormQty] = useState('1');
  const [formClub, setFormClub] = useState('');
  const [formTheirMember, setFormTheirMember] = useState('');
  const [formOurMember, setFormOurMember] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDuration, setFormDuration] = useState('14');
  const [formNotes, setFormNotes] = useState('');
  const [modalError, setModalError] = useState('');
  const [savingLending, setSavingLending] = useState(false);

  // Bulk Lending Modal state
  const [bulkVisible, setBulkVisible] = useState(false);
  const [bulkCart, setBulkCart] = useState<{ itemId: number; qty: number; itemName: string }[]>([]);
  const [cartItemId, setCartItemId] = useState<number | null>(null);
  const [cartQty, setCartQty] = useState('1');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [lRes, iRes] = await Promise.all([
        api.getLendings({ limit: 100 }),
        api.getInventory()
      ]);
      setLendings(lRes);
      setItems(iRes);
    } catch (err) {
      console.error('Failed to load lending data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const calculateDaysLeft = (lentOn: string, duration: number) => {
    const retDate = new Date(lentOn + "T00:00:00");
    retDate.setDate(retDate.getDate() + duration);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((retDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr + "T00:00:00").toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'});
  };
  
  const getReturnDate = (lentOn: string, duration: number) => {
    const d = new Date(lentOn + "T00:00:00");
    d.setDate(d.getDate() + duration);
    return formatDate(d.toISOString().split('T')[0]);
  };

  const handleReturn = async (id: number, itemName: string | undefined) => {
    Alert.alert(
      'Mark Returned',
      `Mark "${itemName || 'Item'}" as returned to lab?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Return', 
          onPress: async () => {
            try {
              await api.markReturned(id);
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to process return');
            }
          }
        }
      ]
    );
  };

  const handleSaveLending = async () => {
    if (!selectedItemId) {
      setModalError('Please select an item');
      return;
    }
    const qty = parseInt(formQty);
    const duration = parseInt(formDuration);
    if (isNaN(qty) || qty < 1) {
      setModalError('Quantity must be at least 1');
      return;
    }
    if (isNaN(duration) || duration < 1) {
      setModalError('Duration must be at least 1 day');
      return;
    }
    if (!formClub.trim() || !formTheirMember.trim() || !formOurMember.trim()) {
      setModalError('Club, Borrower Name and Handler Name are required');
      return;
    }

    setSavingLending(true);
    setModalError('');
    try {
      await api.addLending({
        itemId: selectedItemId,
        qty,
        club: formClub.trim(),
        theirMember: formTheirMember.trim(),
        ourMember: formOurMember.trim(),
        borrowerEmail: formEmail.trim() || null,
        lentOn: new Date().toISOString().split('T')[0],
        duration,
        notes: formNotes.trim() || null,
      });
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to checkout item');
    } finally {
      setSavingLending(false);
    }
  };

  const handleAddToCart = () => {
    if (!cartItemId) return;
    const qty = parseInt(cartQty);
    if (isNaN(qty) || qty < 1) return;

    const matched = items.find(i => i.id === cartItemId);
    if (!matched) return;

    // Check availability
    if ((matched.availQty ?? 0) < qty) {
      Alert.alert('Error', `Only ${matched.availQty} available in stock.`);
      return;
    }

    // Add to cart
    setBulkCart([...bulkCart, { itemId: cartItemId, qty, itemName: matched.name }]);
    setCartItemId(null);
    setCartQty('1');
  };

  const handleSaveBulkLending = async () => {
    if (bulkCart.length === 0) {
      setModalError('Please add items to bulk checkout cart');
      return;
    }
    if (!formClub.trim() || !formTheirMember.trim() || !formOurMember.trim()) {
      setModalError('Club, Borrower Name and Handler Name are required');
      return;
    }
    const duration = parseInt(formDuration);
    if (isNaN(duration) || duration < 1) {
      setModalError('Duration must be at least 1 day');
      return;
    }

    setSavingLending(true);
    setModalError('');
    try {
      await api.bulkLend({
        items: bulkCart.map(i => ({ itemId: i.itemId, qty: i.qty })),
        club: formClub.trim(),
        theirMember: formTheirMember.trim(),
        ourMember: formOurMember.trim(),
        borrowerEmail: formEmail.trim() || undefined,
        lentOn: new Date().toISOString().split('T')[0],
        duration,
        notes: formNotes.trim() || undefined,
      });
      setBulkVisible(false);
      setBulkCart([]);
      loadData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to submit bulk checkout');
    } finally {
      setSavingLending(false);
    }
  };

  const renderLending = ({ item }: { item: Lending }) => {
    const dl = calculateDaysLeft(item.lentOn, item.duration);
    
    let dueColor = '#16a34a';
    let dueBg = isDark ? '#16a34a20' : '#f0fdf4';
    let dueText = `${dl}d left`;

    if (dl < 0) {
      dueColor = '#dc2626';
      dueBg = isDark ? '#dc262620' : '#fef2f2';
      dueText = `${Math.abs(dl)}d overdue`;
    } else if (dl === 0) {
      dueColor = '#ea580c';
      dueBg = isDark ? '#ea580c20' : '#fff7ed';
      dueText = 'Due today';
    }

    return (
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemName, { color: colors.text }]}>{item.itemName}</Text>
            <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
              Quantity: {item.qty} • Club: {item.club}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: dueBg }]}>
            <Text style={[styles.badgeText, { color: dueColor }]}>{dueText}</Text>
          </View>
        </View>

        <View style={styles.membersRow}>
          <View style={styles.memberBox}>
            <Text style={[styles.memberLabel, { color: colors.textSecondary }]}>Borrower</Text>
            <Text style={[styles.memberVal, { color: colors.text }]}>{item.theirMember}</Text>
          </View>
          <View style={styles.memberBox}>
            <Text style={[styles.memberLabel, { color: colors.textSecondary }]}>Handler</Text>
            <Text style={[styles.memberVal, { color: colors.text }]}>{item.ourMember}</Text>
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.backgroundSelected }]}>
          <View>
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Lent On: {formatDate(item.lentOn)}</Text>
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Return By: {getReturnDate(item.lentOn, item.duration)}</Text>
          </View>
          <Pressable 
            onPress={() => handleReturn(item.id, item.itemName)}
            style={({ pressed }) => [
              styles.returnBtn,
              { opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Text style={styles.returnText}>Mark Returned</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const availableItems = items.filter(i => (i.availQty ?? 0) > 0);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#185FA5" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header bar */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Active Lendings ({lendings.length})
        </Text>
        <View style={styles.headerBtns}>
          <Pressable 
            onPress={() => {
              setModalError('');
              setFormClub('');
              setFormTheirMember('');
              setFormOurMember('');
              setFormEmail('');
              setBulkCart([]);
              setBulkVisible(true);
            }} 
            style={[styles.addBtn, { backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.backgroundSelected }]}
          >
            <PackagePlus size={14} color={colors.text} />
            <Text style={[styles.addText, { color: colors.text }]}>Bulk</Text>
          </Pressable>
          
          <Pressable 
            onPress={() => {
              setModalError('');
              setFormClub('');
              setFormTheirMember('');
              setFormOurMember('');
              setFormEmail('');
              setSelectedItemId(null);
              setModalVisible(true);
            }} 
            style={styles.addBtn}
          >
            <Plus size={14} color="#fff" />
            <Text style={styles.addText}>Lend</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={lendings}
        renderItem={renderLending}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#185FA5" />
        }
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No active lendings</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              All checked out components have been returned to the lab registry.
            </Text>
          </View>
        }
      />

      {/* New Lending Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundElement }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Lending Checkout</Text>
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
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Select Item *</Text>
                <View style={[styles.selectBox, { borderColor: colors.backgroundSelected }]}>
                  {availableItems.map(item => (
                    <Pressable 
                      key={item.id}
                      onPress={() => setSelectedItemId(item.id)}
                      style={[
                        styles.selectPill,
                        selectedItemId === item.id ? { backgroundColor: '#185FA5' } : { backgroundColor: colors.backgroundElement }
                      ]}
                    >
                      <Text style={[styles.selectPillText, { color: selectedItemId === item.id ? '#fff' : colors.text }]}>
                        {item.name} ({item.availQty} avail)
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Checkout Qty *</Text>
                  <TextInput
                    style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                    keyboardType="numeric"
                    value={formQty}
                    onChangeText={setFormQty}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Duration (Days) *</Text>
                  <TextInput
                    style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                    keyboardType="numeric"
                    value={formDuration}
                    onChangeText={setFormDuration}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Borrowing Club / Group *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={formClub}
                  onChangeText={setFormClub}
                  placeholder="e.g. AeroClub"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Borrower Name *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={formTheirMember}
                  onChangeText={setFormTheirMember}
                  placeholder="e.g. Jane Doe"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Borrower Email</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={formEmail}
                  onChangeText={setFormEmail}
                  placeholder="e.g. jane@gmail.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Lending Handler *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={formOurMember}
                  onChangeText={setFormOurMember}
                  placeholder="e.g. Lab Assistant John"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.descInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  multiline
                  numberOfLines={2}
                  value={formNotes}
                  onChangeText={setFormNotes}
                  placeholder="Additional checkout remarks..."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.backgroundElement, backgroundColor: colors.backgroundElement }]}>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleSaveLending} 
                style={[styles.modalSaveBtn, { opacity: savingLending ? 0.8 : 1 }]}
                disabled={savingLending}
              >
                {savingLending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Checkout</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bulk Lending Modal */}
      <Modal
        visible={bulkVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBulkVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundElement }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Bulk Checkout</Text>
              <Pressable onPress={() => setBulkVisible(false)}>
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

              {/* Items Cart */}
              <View style={[styles.cartSection, { borderColor: colors.backgroundSelected }]}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Checkout Basket ({bulkCart.length})</Text>
                {bulkCart.length > 0 ? (
                  bulkCart.map((c, idx) => (
                    <View key={idx} style={styles.cartRow}>
                      <Text style={[styles.cartItemText, { color: colors.text }]}>{c.qty}x {c.itemName}</Text>
                      <Pressable onPress={() => setBulkCart(bulkCart.filter((_, i) => i !== idx))}>
                        <X size={16} color="#dc2626" />
                      </Pressable>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyCartText, { color: colors.textSecondary }]}>Basket is empty.</Text>
                )}

                {/* Add to Basket Form */}
                <View style={styles.addToCartBox}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                    {availableItems.map(item => (
                      <Pressable 
                        key={item.id}
                        onPress={() => setCartItemId(item.id)}
                        style={[
                          styles.selectPill,
                          cartItemId === item.id ? { backgroundColor: '#185FA5' } : { backgroundColor: colors.backgroundElement }
                        ]}
                      >
                        <Text style={[styles.selectPillText, { color: cartItemId === item.id ? '#fff' : colors.text }]}>
                          {item.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <View style={styles.cartFormRow}>
                    <TextInput
                      style={[styles.formInput, { flex: 1, color: colors.text, borderColor: colors.backgroundSelected }]}
                      keyboardType="numeric"
                      placeholder="Qty"
                      placeholderTextColor={colors.textSecondary}
                      value={cartQty}
                      onChangeText={setCartQty}
                    />
                    <Pressable onPress={handleAddToCart} style={styles.cartAddBtn}>
                      <Text style={styles.cartAddText}>Add to Basket</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Duration (Days) *</Text>
                  <TextInput
                    style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                    keyboardType="numeric"
                    value={formDuration}
                    onChangeText={setFormDuration}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Borrowing Club *</Text>
                  <TextInput
                    style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                    value={formClub}
                    onChangeText={setFormClub}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Borrower Name *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={formTheirMember}
                  onChangeText={setFormTheirMember}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Borrower Email</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={formEmail}
                  onChangeText={setFormEmail}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Handler Name *</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.text, borderColor: colors.backgroundSelected }]}
                  value={formOurMember}
                  onChangeText={setFormOurMember}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.backgroundElement, backgroundColor: colors.backgroundElement }]}>
              <Pressable onPress={() => setBulkVisible(false)} style={styles.modalCancelBtn}>
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleSaveBulkLending} 
                style={[styles.modalSaveBtn, { opacity: savingLending ? 0.8 : 1 }]}
                disabled={savingLending}
              >
                {savingLending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Checkout Bulk</Text>
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
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
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
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11,
    marginTop: 2,
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
  membersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  memberBox: {
    gap: 2,
    flex: 1,
  },
  memberLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  memberVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    marginTop: 4,
  },
  dateLabel: {
    fontSize: 11,
    lineHeight: 16,
  },
  returnBtn: {
    backgroundColor: '#185FA51a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  returnText: {
    color: '#185FA5',
    fontSize: 11,
    fontWeight: '700',
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
    marginBottom: 16,
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
    marginRight: 4,
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
  cartSection: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.two,
    marginBottom: 16,
    gap: 8,
  },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  cartItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCartText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  addToCartBox: {
    gap: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
    paddingTop: 8,
  },
  cartFormRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cartAddBtn: {
    flex: 2,
    backgroundColor: '#185FA5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  cartAddText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
