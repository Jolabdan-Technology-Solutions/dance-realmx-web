import { useCallback } from 'react';

interface ParsedError {
  message: string;
  statusCode?: number;
  validationErrors?: Record<string, string[]>;
  isValidationError: boolean;
  isNetworkError: boolean;
  isServerError: boolean;
  helpText?: string;
}

export function useErrorHandler() {
  const parseError = useCallback((error: any): ParsedError => {
    // Default error structure
    const defaultError: ParsedError = {
      message: 'An unexpected error occurred',
      isValidationError: false,
      isNetworkError: false,
      isServerError: false,
    };

    if (!error) return defaultError;

    // Handle Axios errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle validation errors (400)
      if (status === 400 && data?.message) {
        return {
          message: data.message,
          statusCode: status,
          validationErrors: data.validationErrors || {},
          isValidationError: true,
          isNetworkError: false,
          isServerError: false,
          helpText: 'Please check your input and try again.',
        };
      }

      // Handle unauthorized (401)
      if (status === 401) {
        return {
          message: data?.message || 'Invalid credentials',
          statusCode: status,
          isValidationError: false,
          isNetworkError: false,
          isServerError: false,
          helpText: 'Please check your email and password.',
        };
      }

      // Handle forbidden (403)
      if (status === 403) {
        return {
          message: data?.message || 'Access denied',
          statusCode: status,
          isValidationError: false,
          isNetworkError: false,
          isServerError: false,
          helpText: 'You don\'t have permission to perform this action.',
        };
      }

      // Handle server errors (500+)
      if (status >= 500) {
        return {
          message: 'Server error occurred',
          statusCode: status,
          isValidationError: false,
          isNetworkError: false,
          isServerError: true,
          helpText: 'Please try again later or contact support if the problem persists.',
        };
      }

      // Handle other HTTP errors
      return {
        message: data?.message || `Error ${status}`,
        statusCode: status,
        isValidationError: false,
        isNetworkError: false,
        isServerError: false,
      };
    }

    // Handle network errors
    if (error.request || error.code === 'NETWORK_ERROR') {
      return {
        message: 'Network error occurred',
        isValidationError: false,
        isNetworkError: true,
        isServerError: false,
        helpText: 'Please check your internet connection and try again.',
      };
    }

    // Handle direct error messages
    if (typeof error === 'string') {
      return {
        message: error,
        isValidationError: false,
        isNetworkError: false,
        isServerError: false,
      };
    }

    // Handle error objects with message property
    if (error.message) {
      return {
        message: error.message,
        isValidationError: false,
        isNetworkError: false,
        isServerError: false,
      };
    }

    return defaultError;
  }, []);

  const getFieldError = useCallback((parsedError: ParsedError | null, fieldName: string): string | undefined => {
    if (!parsedError?.validationErrors) return undefined;
    
    const fieldErrors = parsedError.validationErrors[fieldName];
    return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : undefined;
  }, []);

  const hasFieldError = useCallback((parsedError: ParsedError | null, fieldName: string): boolean => {
    return !!getFieldError(parsedError, fieldName);
  }, [getFieldError]);

  return {
    parseError,
    getFieldError,
    hasFieldError,
  };
}
