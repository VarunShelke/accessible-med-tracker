export type OperationType = 'USE' | 'ADD' | 'UNKNOWN' | 'UNSURE';

export interface TextAnalysisRequest {
  text: string;
}

export interface TextAnalysisResult {
  operation: OperationType;
  possible_product_name: string;
  quantity: string;
  possible_product_id: string;
  notes?: string;
}

export interface TextAnalysisResponse {
  items: TextAnalysisResult[];
}
