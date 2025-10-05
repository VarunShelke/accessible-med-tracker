import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {ScannedItem, ScanMode} from '../types/inventory';
import {colors} from '../styles/colors';
import {spacing, touchTarget, fontSize} from '../styles/spacing';
import {CalendarClock} from 'lucide-react-native';

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
  onEdit,
}) => {
  const actionText = mode === 'add' ? 'Add' : 'Use';
  const itemCountText = `${actionText} ${items.length} ${items.length === 1 ? 'Item' : 'Items'}`;
  const buttonColor = mode === 'add' ? colors.success : colors.danger;

  const handleCountChange = (barcode: string, value: string, currentQuantity: number) => {
    const numValue = parseInt(value, 10);

    // Validate input
    if (isNaN(numValue) || numValue < 0) {
      onEdit(barcode, 0); // Minimum value is 0
      return;
    }

    // For 'use' mode, can't exceed current inventory quantity
    if (mode === 'use' && numValue > currentQuantity) {
      onEdit(barcode, currentQuantity);
      return;
    }

    onEdit(barcode, numValue);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Scanned Items</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.nameColumn]}>Item Name</Text>
          <Text style={[styles.headerCell, styles.quantityColumn]}>Current</Text>
          <Text style={[styles.headerCell, styles.changeColumn]}>{mode === 'add' ? 'Add' : 'Use'} Stock</Text>
        </View>

        {/* Table Body */}
        <ScrollView style={styles.tableBody}>
        {items.map(item => (
          <View
            key={item.barcode}
            style={styles.tableRow}
            accessible={true}
            accessibilityLabel={`${item.name}, expires ${item.expirationDate}, current quantity ${item.currentQuantity}, ${mode === 'add' ? 'adding' : 'using'} ${item.count}`}>
            {/* Item Name with Expiry below */}
            <View style={styles.nameColumn}>
              <Text style={styles.itemNameText} numberOfLines={1}>
                {item.name || item.barcode}
              </Text>
              <View style={styles.expiryRow}>
                <CalendarClock size={12} color={colors.textSecondary} />
                <Text style={styles.expiryText}>{item.expirationDate}</Text>
              </View>
            </View>

            {/* Current Quantity */}
            <Text style={[styles.tableCell, styles.quantityColumn]}>
              {item.currentQuantity}
            </Text>

            {/* Change Count with number input */}
            <View style={styles.changeColumn}>
              <TextInput
                style={[
                  styles.changeInput,
                  mode === 'add' ? styles.inputAdd : styles.inputUse,
                ]}
                value={item.count == 0 ? '' : item.count.toString()}
                onChangeText={value =>
                  handleCountChange(item.barcode, value, item.currentQuantity)
                }
                keyboardType="number-pad"
                returnKeyType='done'
                selectTextOnFocus
                accessible={true}
                accessibilityLabel={`Change quantity for ${item.name}, current value ${item.count}`}
                accessibilityHint={`Enter a number to ${mode === 'add' ? 'add' : 'remove'} items`}
              />
            </View>
          </View>
        ))}
        </ScrollView>

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
            accessibilityLabel={`${itemCountText} to inventory`}
            accessibilityRole="button">
            <Text style={styles.confirmButtonText}>{itemCountText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
  },
  content: {
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
  // Table styles
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  headerCell: {
    fontSize: fontSize.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  tableBody: {
    maxHeight: 250,
    marginBottom: spacing.md,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: fontSize.body,
    color: colors.text,
  },
  // Column widths
  nameColumn: {
    flex: 1.5,
  },
  quantityColumn: {
    flex: 0.8,
    textAlign: 'center',
  },
  changeColumn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: 2,
  },
  // Item name and expiry
  itemNameText: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.text,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  expiryText: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  // Change input
  changePrefix: {
    fontSize: fontSize.large,
    fontWeight: 'bold',
    color: colors.text,
  },
  changeInput: {
    height: 36,
    minWidth: 50,
    borderWidth: 2,
    borderRadius: 8,
    fontSize: fontSize.large,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.background,
  },
  inputAdd: {
    borderColor: colors.success,
    color: colors.success,
  },
  inputUse: {
    borderColor: colors.danger,
    color: colors.danger,
  },
  // Action buttons
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
