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

    // Check if this is a datetime string WITHOUT timezone indicator (Z or +/-HH:MM)
    // These come from HTML datetime-local inputs and should be treated as local time
    if (dateString.includes('T') && !dateString.includes('Z') && !dateString.match(/[+-]\d{2}:\d{2}$/)) {
      // This is a local time datetime string from our DatePicker (e.g., "2024-01-15T14:30")
      // Parse the components manually to avoid UTC interpretation
      const [datePart, timePart] = dateString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      
      // Handle time part - could be "HH:mm", "HH:mm:ss", or "HH:mm:ss.sss"
      const timeMatch = timePart.match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
        const milliseconds = timeMatch[4] ? parseInt(timeMatch[4].substring(0, 3).padEnd(3, '0'), 10) : 0;
        return new Date(year, month - 1, day, hours, minutes, seconds, milliseconds); // Local time
      }
    }
  }

  // If it has a timezone indicator (Z or +/-HH:MM), or is not a string, let JavaScript handle it
  // This preserves UTC times and properly formatted ISO strings
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
