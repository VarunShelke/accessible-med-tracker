import axios from 'axios';

export interface ApiError {
  message: string;
  statusCode: number;
}

export const handleAxiosError = (error: unknown): ApiError => {
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
};
