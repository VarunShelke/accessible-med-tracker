import axios from 'axios';
import { InventoryItem, UpdateInventoryRequest, ApiError, AllInventory } from '../types/api';

const API_BASE_URL = 'https://szgw1ra7me.execute-api.us-east-1.amazonaws.com/prod';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock data for testing (until /inventory/sku/{sku} is ready)
const MOCK_ITEMS: Record<string, InventoryItem> = {
  '8901138509231': {
    id: '9346a0ca-80a6-492c-8554-090720458b1b',
    sku: '8901138509231',
    item_name: 'Tylenol',
    quantity: 25,
    expiration_date: '2025-10-17',
    storage_location: 'Bedroom',
  },
  '0079400486554': {
    id: 'cdc9bb3c-a6ce-4445-a5dc-43f32db99a3f',
    sku: '0079400486554',
    item_name: 'Advil',
    quantity: 25,
    expiration_date: '2025-11-14',
    storage_location: 'Bedroom',
  },
};

class InventoryAPI {
  /**
   * Fetch all inventory items
   */
  async getAllInventory(): Promise<InventoryItem[]> {
    try {
      const response = await apiClient.get<AllInventory>('/inventory');
      return response.data.inventory;
    } catch (error) {
      console.error('Get all inventory error:', error);
      throw this.handleAxiosError(error);
    }
  }

  /**
   * Lookup item by SKU (barcode)
   * TODO: Replace with actual API once backend implements GET /inventory/sku/{sku}
   */
  async getItemBySku(sku: string): Promise<InventoryItem | null> {
    // Mock implementation for now
    console.log('Looking up SKU:', sku);

    const allItems = await this.getAllInventory();
    console.log('All items from inventory:', allItems);
    const existingItem = allItems.find(item => item.sku === sku);
    
    if (existingItem) {
      return existingItem;
    }

    // Return null if not found (simulates 404)
    return null;

    // TODO: Replace with actual API call:
    // try {
    //   const response = await apiClient.get<InventoryItem>(`/inventory/sku/${sku}`);
    //   return response.data;
    // } catch (error) {
    //   if (axios.isAxiosError(error) && error.response?.status === 404) {
    //     return null;
    //   }
    //   console.error('Get item by SKU error:', error);
    //   throw this.handleAxiosError(error);
    // }
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
      throw this.handleAxiosError(error);
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
      throw this.handleAxiosError(error);
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
      throw this.handleAxiosError(error);
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

  /**
   * Handle Axios errors
   */
  private handleAxiosError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorMessages: Record<number, string> = {
        400: 'Bad request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Item not found',
        500: 'Server error',
      };

      return {
        message: errorMessages[status] || error.message || 'Unknown error',
        statusCode: status,
      };
    }

    return {
      message: 'Unknown error occurred',
      statusCode: 500,
    };
  }
}

export const inventoryAPI = new InventoryAPI();
