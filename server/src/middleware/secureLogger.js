/**
 * Secure Logger - Masks sensitive data in logs
 * 
 * Usage:
 *   const secureLogger = require('./middleware/secureLogger');
 *   secureLogger.info('User logged in', { email: user.email, id: user.id });
 */

const secureLogger = {
  /**
   * Mask sensitive data in objects
   * @param {any} data - Data to mask
   * @returns {any} - Masked data
   */
  maskSensitiveData: (data) => {
    if (!data) return data;
    
    // Handle primitives
    if (typeof data !== 'object') return data;
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => secureLogger.maskSensitiveData(item));
    }
    
    // Sensitive field names to mask
    const sensitiveFields = [
      'password',
      'passwordhash',
      'token',
      'secret',
      'authorization',
      'cookie',
      'jwt',
      'apikey',
      'api_key',
      'accesstoken',
      'refreshtoken',
      'sessionid',
      'csrf',
      'auth'
    ];
    
    const masked = {};
    
    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase();
      
      // Mask sensitive fields completely
      if (sensitiveFields.some(field => keyLower.includes(field))) {
        masked[key] = '***REDACTED***';
        continue;
      }
      
      // Mask email (show only first 2 chars in production)
      if (keyLower === 'email' && value && typeof value === 'string') {
        if (process.env.NODE_ENV === 'production') {
          masked[key] = value.substring(0, 2) + '***@***';
        } else {
          masked[key] = value; // Full email in development
        }
        continue;
      }
      
      // Mask user ID in production (for privacy)
      if ((keyLower === 'userid' || keyLower === 'id') && process.env.NODE_ENV === 'production') {
        masked[key] = `***${String(value).slice(-3)}`; // Show last 3 digits only
        continue;
      }
      
      // Recursively mask nested objects
      if (value && typeof value === 'object') {
        masked[key] = secureLogger.maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }
    
    return masked;
  },

  /**
   * Log with info level
   */
  info: (message, data = {}) => {
    if (process.env.NODE_ENV === 'production') {
      console.info(message, secureLogger.maskSensitiveData(data));
    } else {
      console.info(message, data); // Full logs in development
    }
  },

  /**
   * Log with error level
   */
  error: (message, data = {}) => {
    if (process.env.NODE_ENV === 'production') {
      console.error(message, secureLogger.maskSensitiveData(data));
    } else {
      console.error(message, data);
    }
  },

  /**
   * Log with warn level
   */
  warn: (message, data = {}) => {
    if (process.env.NODE_ENV === 'production') {
      console.warn(message, secureLogger.maskSensitiveData(data));
    } else {
      console.warn(message, data);
    }
  },

  /**
   * Log with debug level (only in development)
   */
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(message, data);
    }
  },

  /**
   * Log with log level
   */
  log: (message, data = {}) => {
    if (process.env.NODE_ENV === 'production') {
      console.log(message, secureLogger.maskSensitiveData(data));
    } else {
      console.log(message, data);
    }
  }
};

module.exports = secureLogger;
