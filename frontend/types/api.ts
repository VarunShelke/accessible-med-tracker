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
}

export interface UpdateInventoryRequest {
  quantity: number;
  // Can add other fields if needed
}

export interface ApiError {
  message: string;
  statusCode: number;
}
