import React from 'react';
import {View, Text, TouchableOpacity, FlatList, StyleSheet} from 'react-native';
import {ScannedItem, ScanMode} from '../types/inventory';
import {colors} from '../styles/colors';
import {spacing, touchTarget, fontSize} from '../styles/spacing';

interface ScanConfirmationProps {
  items: ScannedItem[];
  mode?: ScanMode;
  onConfirm: () => void;
  onClear: () => void;
  onEdit: (barcode: string, newCount: number) => void;
}

export const ScanConfirmation: React.FC<ScanConfirmationProps> = ({
  items,
  mode,
  onConfirm,
  onClear,
}) => {
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);
  const actionText = mode === 'add' ? 'Add' : 'Use';
  const buttonColor = mode === 'add' ? colors.success : colors.danger;

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scanned Items</Text>

      <FlatList
        data={items}
        keyExtractor={item => item.barcode}
        renderItem={({item}) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name || item.barcode}</Text>
            <Text style={styles.itemCount}>x {item.count}</Text>
          </View>
        )}
        style={styles.list}
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onClear}
          accessible={true}
          accessibilityLabel="Clear all scanned items"
          accessibilityRole="button">
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, {backgroundColor: buttonColor}]}
          onPress={onConfirm}
          accessible={true}
          accessibilityLabel={`${actionText} ${totalCount} items to inventory`}
          accessibilityRole="button">
          <Text style={styles.confirmButtonText}>
            {actionText} {totalCount} {totalCount === 1 ? 'Item' : 'Items'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: fontSize.heading,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  list: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemName: {
    fontSize: fontSize.large,
    color: colors.text,
    flex: 1,
  },
  itemCount: {
    fontSize: fontSize.large,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  clearButton: {
    flex: 1,
    height: touchTarget.large,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  clearButtonText: {
    fontSize: fontSize.large,
    color: colors.text,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    height: touchTarget.large,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  confirmButtonText: {
    fontSize: fontSize.large,
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
});
