import apiClient from '@/services/api';
import inventoryAPI from '@/services/inventory-api';
import { handleAxiosError } from '@/services/utils';
import { TextAnalysisRequest, TextAnalysisResponse, TextAnalysisResult } from '@/types/text-analysis';
import { InventoryItem } from '@/types/api';

class TextAnalysisAPI {
  /**
   * Analyze text and extract inventory operations
   */
  async analyzeText(text: string): Promise<TextAnalysisResponse> {
    try {
      const response = await apiClient.post<TextAnalysisResponse>('/analysis', { text } as TextAnalysisRequest);
      return response.data;
    } catch (error) {
      console.error('Text analysis error:', error);
      throw handleAxiosError(error);
    }
  }

  /**
   * Process analysis results and update inventory
   * Returns updated items and any errors
   */
  async processAnalysisAndUpdateInventory(analysisResults: TextAnalysisResponse): Promise<{
    success: InventoryItem[];
    errors: Array<string>;
  }> {
    const updates: Array<{ id: string; quantity: number }> = [];
    const errors: Array<string> = [];

    // Prepare updates based on analysis
    for (const result of analysisResults.items) {
      if (!result.possible_product_id) {
        errors.push(result.notes || `Item '${result.possible_product_name}' not recognized in inventory`);
        continue;
      }

      const quantity = parseInt(result.quantity, 10);
      if (isNaN(quantity)) {
        errors.push(result.notes || `Invalid quantity ${result.quantity} for item '${result.possible_product_name}'`);
        continue;
      }

      // Get current inventory item
      try {
        const allInventory = await inventoryAPI.getAllInventory({
          id: result.possible_product_id,
        });
        const currentItem = allInventory[0];

        if (!currentItem) {
          errors.push(`Item '${result.possible_product_name}' not found in inventory`);
          continue;
        }

        // Calculate new quantity based on operation
        let newQuantity = currentItem.quantity;
        const operation = result.operation.toString().toLowerCase();
        if (operation === 'add') {
          newQuantity += quantity;
        } else if (operation === 'use') {
          newQuantity = Math.max(0, newQuantity - quantity);
        } else {
          errors.push(result.notes || 'Text analysis could not determine operation. Please try again.');
          continue;
        }

        updates.push({
          id: result.possible_product_id,
          quantity: newQuantity,
        });
      } catch (error) {
        errors.push(`Failed to fetch item: ${result.possible_product_name}`);
      }
    }

    // Batch update inventory
    if (updates.length > 0) {
      const result = await inventoryAPI.batchUpdateInventory(updates);
      console.log('Batch update result:', result);

      // Convert batch update errors to our format
      const batchErrors = result.errors.map((err) => err.error);

      return {
        success: result.success,
        errors: [...errors, ...batchErrors],
      };
    }

    return {
      success: [],
      errors,
    };
  }

  /**
   * Convenience method: Analyze text and update inventory in one call
   */
  async analyzeAndUpdate(text: string): Promise<{
    analysisResults: TextAnalysisResponse;
    updateResults: {
      success: InventoryItem[];
      errors: Array<string>;
    };
  }> {
    const analysisResults = await this.analyzeText(text);
    const updateResults = await this.processAnalysisAndUpdateInventory(analysisResults);

    return {
      analysisResults,
      updateResults,
    };
  }
}

const textAnalysisAPI = new TextAnalysisAPI();

export default textAnalysisAPI;
