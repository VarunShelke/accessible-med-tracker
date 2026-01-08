export interface AllInventory {
  inventory: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  expiration_date: string; // yyyy-mm-dd
  item_name: string;
  quantity: number;
  sku: string;
  storage_location?: string;
  created_at: string; // ISO date
  updated_at: string; // ISO date
  category?: string;
  supplier_name?: string;
  supplier_phone?: string;
}

export interface UpdateInventoryRequest {
  quantity: number;
  // Can add other fields if needed
}

export interface UpdateInventoryResponse {
  item: InventoryItem;
  message?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface QueryInventoryParams {
  id?: string;
  sku?: string;
}
