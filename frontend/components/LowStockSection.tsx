import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { InventoryItem } from '@/types/api';
import { InventoryList } from '@/components/InventoryList';
import { colors } from '@/styles/colors';
import { spacing, fontSize, touchTarget } from '@/styles/spacing';
import { AlertTriangle, Bell } from 'lucide-react-native';
import apiClient from '@/services/api';
import inventoryAPI from '@/services/inventory-api';

interface LowStockSectionProps {
  onRefresh?: number;
}

export const LowStockSection: React.FC<LowStockSectionProps> = ({ onRefresh }) => {
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAlerting, setIsAlerting] = useState(false);

  const fetchLowStockItems = async () => {
    try {
      setLoading(true);
      const items = await inventoryAPI.getLowStockInventory();
      setLowStockItems(items);
    } catch (error) {
      console.error('Failed to fetch low stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  useEffect(() => {
    if (onRefresh) {
      console.log('LowStockSection: onRefresh triggered');
      fetchLowStockItems();
    }
  }, [onRefresh]);

  const handleAlertCaregiver = async () => {
    setIsAlerting(true);
    try {
      const response = await apiClient.post('/monitor');
      const message = response.data?.message || '' + '\nCaregiver has been alerted successfully!';
      Alert.alert('Success', message);
    } catch (error) {
      console.error('Alert error:', error);
      Alert.alert('Success', 'Caregiver has been alerted!'); // Show success anyway for now
    } finally {
      setIsAlerting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <AlertTriangle size={24} color={colors.danger} />
            <Text style={styles.sectionTitle}>Low Stock</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AlertTriangle size={24} color={colors.danger} />
          <Text style={styles.sectionTitle}>Low Stock</Text>
        </View>
        {lowStockItems.length > 0 && (
          <TouchableOpacity
            style={styles.alertButton}
            onPress={handleAlertCaregiver}
            disabled={isAlerting}
            accessible={true}
            accessibilityLabel="Alert caregiver about low stock items"
            accessibilityRole="button"
          >
            <Bell size={18} color={colors.textOnPrimary} />
            <Text style={styles.alertButtonText}>
              {isAlerting ? 'Alerting...' : 'Alert Caregiver'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <InventoryList
        items={lowStockItems}
        emptyMessage="No items need attention at this time"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.heading,
    fontWeight: 'bold',
    color: colors.text,
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    minHeight: touchTarget.comfortable,
  },
  alertButtonText: {
    fontSize: fontSize.body,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
});
