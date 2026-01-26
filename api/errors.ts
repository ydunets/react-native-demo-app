// FILE 3: api/errors.ts
/**
 * Custom Error Class for API Operations
 */

/**
 * Custom error class for API and authentication errors
 */
export class CustomError extends Error {
  /**
   * HTTP status code (if applicable)
   */
  status: number;

  /**
   * Error message
   */
  message: string;

  /**
   * Create a new CustomError
   * @param message - Error message
   * @param status - HTTP status code (default: 0 for non-HTTP errors)
   */
  constructor(message: string, status: number = 0) {
    super(message);
    this.name = 'CustomError';
    this.message = message;
    this.status = status;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, CustomError.prototype);
  }

  /**
   * Check if error is an authentication error (401)
   */
  isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(): boolean {
    return this.status === 0 || this.message.includes('Network');
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}
