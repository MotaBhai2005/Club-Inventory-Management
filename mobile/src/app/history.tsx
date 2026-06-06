import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  useColorScheme,
  RefreshControl
} from 'react-native';
import * as api from '@/services/api';
import { History } from '@/types';
import { Colors, Spacing } from '@/constants/theme';

export default function HistoryScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.getHistory({ limit: 200 });
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr + "T00:00:00").toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'});
  };

  const renderHistoryItem = ({ item }: { item: History }) => {
    return (
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.itemName, { color: colors.text }]}>{item.itemName}</Text>
            <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
              Quantity: {item.qty} • Club: {item.club}
            </Text>
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
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            Borrowed: {formatDate(item.lentOn)}
          </Text>
          <Text style={[styles.dateText, { color: '#16a34a', fontWeight: '600' }]}>
            Returned: {formatDate(item.returnedOn)}
          </Text>
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
      
      {/* Header bar */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Lending Log History ({history.length})
        </Text>
      </View>

      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#185FA5" />
        }
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No history log</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              There are no returned logs saved in the database registry yet.
            </Text>
          </View>
        }
      />

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
    padding: Spacing.three,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11,
    marginTop: 2,
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
  dateText: {
    fontSize: 11,
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
});
