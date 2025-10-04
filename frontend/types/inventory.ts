export interface Supply {
  id: number;
  barcode: string;
  name: string;
  quantity: number;
  threshold: number;
  createdAt: string;
  updatedAt: string;
}

export type ScanMode = 'add' | 'use';

export interface ScannedItem {
  barcode: string;
  name?: string;
  count: number;
}
