import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/styles/colors';
import { spacing, fontSize } from '@/styles/spacing';
import { Accessibility, Heart, Pill, Package } from 'lucide-react-native';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const categoryIcons: Record<string, any> = {
  mobility: Accessibility,
  moblity: Accessibility, // Handle typo in API
  daily_care: Heart,
  drugs: Pill,
  medicines: Pill,
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const allCategories = ['All', ...categories];

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category.toLowerCase()];
    return IconComponent || Pill; // Default to Pill icon
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {allCategories.map((category) => {
        const isSelected = category === 'All' ? selectedCategory === null : selectedCategory === category;
        const Icon = category !== 'All' ? getCategoryIcon(category) : Package;

        return (
          <TouchableOpacity
            key={category}
            style={styles.categoryButton}
            onPress={() => onSelectCategory(category === 'All' ? null : category)}
            accessible={true}
            accessibilityLabel={`Filter by ${category}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
              <Icon
                size={28}
                color={isSelected ? colors.textOnPrimary : colors.text}
              />
            </View>
            <Text style={[styles.categoryText, isSelected && styles.selectedText]}>
              {category === 'All' ? 'All' : category.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  categoryButton: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 80,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIconContainer: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  selectedText: {
    color: colors.primary,
  },
});
