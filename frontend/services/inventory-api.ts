import apiClient from '@/services/api';
import { handleAxiosError } from '@/services/utils';
import { AllInventory, InventoryItem, UpdateInventoryRequest, QueryInventoryParams } from '@/types/api';

class InventoryAPI {
  /**
   * Fetch all inventory items
   */
  async getAllInventory(params?: QueryInventoryParams): Promise<InventoryItem[]> {
    try {
      const response = await apiClient.get<AllInventory>('/inventory', { params });
      return response.data.inventory;
    } catch (error) {
      console.error('Get all inventory error:', error);
      throw handleAxiosError(error);
    }
  }

  /**
   * Lookup item by SKU (barcode)
   */
  async getItemBySku(sku: string): Promise<InventoryItem | null> {
    console.log('Looking up SKU:', sku);

    const result = await this.getAllInventory({ sku });
    if (result.length > 0) {
      return result[0];
    }

    // Return null if not found (simulates 404)
    return null;
  }

  /**
   * Update inventory item quantity
   */
  async updateInventory(id: string, data: UpdateInventoryRequest): Promise<InventoryItem> {
    try {
      const response = await apiClient.put<InventoryItem>(`/inventory/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update inventory error:', error);
      throw handleAxiosError(error);
    }
  }

  /**
   * Create new inventory item
   */
  async createInventory(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    try {
      const response = await apiClient.post<InventoryItem>('/inventory', item);
      return response.data;
    } catch (error) {
      console.error('Create inventory error:', error);
      throw handleAxiosError(error);
    }
  }

  /**
   * Delete inventory item
   */
  async deleteInventory(id: string): Promise<void> {
    try {
      await apiClient.delete(`/inventory/${id}`);
    } catch (error) {
      console.error('Delete inventory error:', error);
      throw handleAxiosError(error);
    }
  }

  /**
   * Batch update multiple items (parallel PUT requests)
   */
  async batchUpdateInventory(
    updates: Array<{ id: string; quantity: number }>
  ): Promise<{ success: InventoryItem[]; errors: Array<{ id: string; error: string }> }> {
    const results = await Promise.allSettled(
      updates.map((update) => this.updateInventory(update.id, { quantity: update.quantity }))
    );

    const success: InventoryItem[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success.push(result.value);
      } else {
        errors.push({
          id: updates[index].id,
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    return { success, errors };
  }
}

const inventoryAPI = new InventoryAPI();

export default inventoryAPI;
