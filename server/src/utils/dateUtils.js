/**
 * Date utility functions for handling timezone issues
 */

/**
 * Parse date strings, treating date-only inputs and local datetime inputs as local time to avoid UTC interpretation
 * @param {string} dateString - Date string in YYYY-MM-DD or ISO format
 * @returns {Date} Parsed Date object
 */
function parseLocalDate(dateString) {
  if (typeof dateString === 'string') {
    if (!dateString.includes('T')) {
      // Date-only input (YYYY-MM-DD): parse as local date at end of day
      // This avoids JavaScript's default UTC interpretation of date strings
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day, 23, 59, 0, 0); // Local time
    }

    // Check if this is a datetime string that represents local time (e.g., from DatePicker with T23:59)
    if (dateString.includes('T') && (dateString.endsWith('T23:59') || dateString.endsWith('T23:59:00') || dateString.endsWith('T23:59:00.000'))) {
      // This appears to be a local time datetime string from our DatePicker
      // Parse the components manually to avoid UTC interpretation
      const [datePart, timePart] = dateString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes, seconds || 0, 0); // Local time
    }
  }

  // Other datetime strings or invalid inputs - let JavaScript handle them
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
