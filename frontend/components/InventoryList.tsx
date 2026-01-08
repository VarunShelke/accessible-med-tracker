import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { InventoryItem } from '@/types/api';
import { colors } from '@/styles/colors';
import { spacing, fontSize } from '@/styles/spacing';
import { Calendar, Package } from 'lucide-react-native';

interface InventoryListProps {
  items: InventoryItem[];
  emptyMessage?: string;
}

export const InventoryList: React.FC<InventoryListProps> = ({ items, emptyMessage = 'No items found' }) => {
  const renderItem = ({ item }: { item: InventoryItem }) => {
    const isLowStock = item.quantity <= 10;
    const daysUntilExpiration = Math.ceil(
      (new Date(item.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const isNearExpiration = daysUntilExpiration <= 14 && daysUntilExpiration >= 0;

    return (
      <View
        style={[
          styles.itemCard,
          (isLowStock || isNearExpiration) && styles.warningCard,
        ]}
        accessible={true}
        accessibilityLabel={`${item.item_name}, quantity ${item.quantity}, expires on ${item.expiration_date}`}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.item_name}</Text>
          <View style={styles.quantityBadge}>
            <Package size={16} color={isLowStock ? colors.danger : colors.text} />
            <Text style={[styles.quantityText, isLowStock && styles.warningText]}>
              {item.quantity}
            </Text>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Calendar size={14} color={isNearExpiration ? colors.danger : colors.textSecondary} />
            <Text style={[styles.detailText, isNearExpiration && styles.warningText]}>
              Expires: {item.expiration_date}
              {daysUntilExpiration >= 0 && ` (${daysUntilExpiration}d)`}
            </Text>
          </View>
          {item.category && (
            <Text style={styles.categoryText}>{item.category.split('_').join(' ')}</Text>
          )}
        </View>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    gap: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warningCard: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.large,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  quantityText: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.text,
  },
  warningText: {
    color: colors.danger,
  },
  itemDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  categoryText: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
