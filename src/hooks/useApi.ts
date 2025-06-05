import { useState, useCallback } from 'react';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';
import { ApiError } from '../services/api';

interface UseApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<void>;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<AxiosResponse<T>>,
  {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
  }: {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    successMessage?: string;
    errorMessage?: string;
  } = {}
): UseApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiFunction(...args);
        setData(response.data);
        if (successMessage) {
          toast.success(successMessage);
        }
        onSuccess?.(response.data);
      } catch (err) {
        const error = err instanceof ApiError ? err : new ApiError(500, errorMessage || 'An error occurred');
        setError(error.message);
        toast.error(error.message);
        onError?.(error.message);
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, onSuccess, onError, successMessage, errorMessage]
  );

  return { data, loading, error, execute };
} 