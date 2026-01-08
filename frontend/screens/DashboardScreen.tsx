import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { LowStockSection } from '@/components/LowStockSection';
import { CategoryFilter } from '@/components/CategoryFilter';
import { InventoryList } from '@/components/InventoryList';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@/styles/colors';
import { spacing, fontSize } from '@/styles/spacing';
import { InventoryItem } from '@/types/api';
import inventoryAPI from '@/services/inventory-api';
import { Package, Search } from 'lucide-react-native';

export const DashboardScreen: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInventory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const items = await inventoryAPI.getAllInventory();
      setInventory(items);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const getUniqueCategories = (): string[] => {
    const categories = inventory
      .map((item) => item.category)
      .filter((category): category is string => Boolean(category));
    return Array.from(new Set(categories));
  };

  const getFilteredItems = (): InventoryItem[] => {
    let filtered = inventory;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => item.item_name.toLowerCase().includes(query));
    }

    return filtered;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  const categories = ['mobility', 'daily_care', 'medicines']; // Remove typo later
  const filteredItems = getFilteredItems();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Dashboard" subtitle="View and manage your inventory" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchInventory(true)} tintColor={colors.primary} />
        }
      >
        {/* Low Stock Section */}
        <LowStockSection />

      <View style={styles.divider} />

      {/* All Items Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Package size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>All Inventory</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name..."
            placeholderTextColor={colors.textSecondary}
            accessible={true}
            accessibilityLabel="Search inventory"
            accessibilityHint="Type to search items by name, SKU, category, or location"
          />
        </View>

        {/* Category Filter */}
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}

        {/* Inventory List */}
        <View style={styles.listContainer}>
          <InventoryList
            items={filteredItems}
            emptyMessage={
              searchQuery.trim()
                ? 'No items match your search'
                : selectedCategory
                ? 'No items in this category'
                : 'No items found'
            }
          />
        </View>
      </View>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.background,
    paddingVertical: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.heading,
    fontWeight: 'bold',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.body,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  divider: {
    height: 8,
    backgroundColor: colors.border,
  },
});
