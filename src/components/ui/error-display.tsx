import React from 'react';
import { AlertCircle, HelpCircle, Mail, Phone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  className?: string;
}

/**
 * Enhanced error display component that handles various error formats
 * and provides user-friendly messages with helpful context
 */
export function ErrorDisplay({ error, onRetry, className = '' }: ErrorDisplayProps) {
  if (!error) return null;

  const getErrorDetails = (error: any) => {
    // Handle different error formats
    let message = '';
    let details: string[] = [];
    let isValidationError = false;
    let statusCode = null;

    // Extract error information from various formats
    if (typeof error === 'string') {
      message = error;
    } else if (error?.response?.data) {
      // Axios error format
      const data = error.response.data;
      statusCode = error.response.status;
      
      if (data.message) {
        message = data.message;
      }
      
      // Handle validation errors
      if (data.errors && Array.isArray(data.errors)) {
        isValidationError = true;
        details = data.errors;
      } else if (data.error && typeof data.error === 'object') {
        // Handle field-specific validation errors
        isValidationError = true;
        details = Object.entries(data.error).map(([field, msgs]) => 
          `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
        );
      }
    } else if (error?.message) {
      message = error.message;
      
      // Check if it's a network error
      if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
        message = 'Network connection error. Please check your internet connection.';
      }
    } else if (error?.data) {
      // Direct API response
      message = error.data.message || 'An error occurred';
      if (error.data.errors) {
        isValidationError = true;
        details = error.data.errors;
      }
    }

    // Fallback message
    if (!message) {
      message = 'An unexpected error occurred. Please try again.';
    }

    return {
      message,
      details,
      isValidationError,
      statusCode
    };
  };

  const { message, details, isValidationError, statusCode } = getErrorDetails(error);

  const getErrorIcon = () => {
    if (isValidationError) {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <AlertCircle className="h-4 w-4" />;
  };

  const getHelpText = () => {
    if (isValidationError) {
      return "Please correct the highlighted fields and try again.";
    }
    
    if (statusCode === 401) {
      return "Please check your login credentials and try again.";
    }
    
    if (statusCode === 403) {
      return "You don't have permission to perform this action.";
    }
    
    if (statusCode === 404) {
      return "The requested resource was not found.";
    }
    
    if (statusCode === 429) {
      return "Too many requests. Please wait a moment and try again.";
    }
    
    if (statusCode >= 500) {
      return "Our servers are experiencing issues. Please try again in a few minutes.";
    }
    
    return "If this problem persists, please contact support.";
  };

  return (
    <Alert variant="destructive" className={`relative ${className}`}>
      <div className="flex items-start space-x-2">
        {getErrorIcon()}
        <div className="flex-1 min-w-0">
          <AlertDescription>
            <div className="space-y-2">
              {/* Main error message */}
              <div className="font-medium text-sm">
                {message}
              </div>
              
              {/* Validation details */}
              {details.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium opacity-90">
                    Details:
                  </div>
                  <ul className="text-xs space-y-1 ml-4">
                    {details.map((detail, index) => (
                      <li key={index} className="list-disc">
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Help text */}
              <div className="text-xs opacity-80 flex items-start space-x-1">
                <HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{getHelpText()}</span>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-2 pt-2">
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="h-8 text-xs"
                  >
                    Try Again
                  </Button>
                )}
                
                {/* Contact support for persistent errors */}
                {(statusCode >= 500 || !statusCode) && (
                  <div className="flex items-center space-x-2 text-xs opacity-80">
                    <span>Need help?</span>
                    <a
                      href="mailto:support@dancerealmx.com"
                      className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 underline"
                    >
                      <Mail className="h-3 w-3" />
                      <span>Contact Support</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

/**
 * Hook for parsing and formatting API errors
 */
export function useErrorHandler() {
  const parseError = (error: any) => {
    if (!error) return null;

    // Extract meaningful error message
    let message = 'An unexpected error occurred';
    let validationErrors: Record<string, string[]> = {};

    if (error?.response?.data) {
      const data = error.response.data;
      
      if (data.message) {
        message = data.message;
      }
      
      // Handle validation errors
      if (data.errors) {
        if (Array.isArray(data.errors)) {
          // Array of error messages
          validationErrors.general = data.errors;
        } else if (typeof data.errors === 'object') {
          // Field-specific errors
          validationErrors = data.errors;
        }
      }
    } else if (error?.message) {
      message = error.message;
    }

    return {
      message,
      validationErrors,
      hasValidationErrors: Object.keys(validationErrors).length > 0
    };
  };

  const getFieldError = (fieldName: string, validationErrors: Record<string, string[]>) => {
    return validationErrors[fieldName]?.[0] || null;
  };

  return {
    parseError,
    getFieldError
  };
}
