/**
 * Date utility functions for handling timezone issues
 */

/**
 * Parse date strings, treating date-only inputs as local time to avoid UTC interpretation
 * @param {string} dateString - Date string in YYYY-MM-DD or ISO format
 * @returns {Date} Parsed Date object
 */
function parseLocalDate(dateString) {
  if (typeof dateString === 'string' && !dateString.includes('T')) {
    // Date-only input (YYYY-MM-DD): parse as local date at end of day
    // This avoids JavaScript's default UTC interpretation of date strings
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 0, 0); // Local time
  }

  // Datetime strings already have timezone info, use as-is
  return new Date(dateString);
}

/**
 * Validate that a date is in the future
 * @param {Date} dateObj - Date object to validate
 * @returns {boolean} True if date is in the future
 */
function isDateInFuture(dateObj) {
  const now = new Date();
  return dateObj > now;
}

module.exports = {
  parseLocalDate,
  isDateInFuture
};
