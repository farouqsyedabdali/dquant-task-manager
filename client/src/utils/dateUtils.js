/**
 * Frontend date utility functions
 */

/**
 * Format date for HTML input fields (YYYY-MM-DD) without timezone conversion issues
 * @param {string|Date} dateValue - Date value to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export function formatDateForInput(dateValue) {
  if (!dateValue) return '';

  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date formatted for input fields
 * @returns {string} Today's date (YYYY-MM-DD)
 */
export function getTodayFormatted() {
  return formatDateForInput(new Date());
}

/**
 * Convert a datetime-local string (from HTML input) to UTC ISO string for server
 * This ensures the server receives the correct UTC time regardless of server timezone
 * @param {string} localDateTimeString - Date string from datetime-local input (e.g., "2024-01-15T14:00")
 * @returns {string} UTC ISO string (e.g., "2024-01-15T19:00:00.000Z" for EST user selecting 2:00 PM)
 */
export function convertLocalDateTimeToUTC(localDateTimeString) {
  if (!localDateTimeString) return null;
  
  // If it's already a full ISO string with timezone, return as-is
  if (localDateTimeString.includes('Z') || localDateTimeString.match(/[+-]\d{2}:\d{2}$/)) {
    return localDateTimeString;
  }
  
  // If it's date-only (YYYY-MM-DD), append T23:59:00 and convert
  if (!localDateTimeString.includes('T')) {
    localDateTimeString = `${localDateTimeString}T23:59:00`;
  }
  
  // Parse as local time and convert to UTC ISO string
  // When you do new Date("2024-01-15T14:00"), JavaScript interprets it as LOCAL time
  // Then toISOString() converts it to UTC
  const localDate = new Date(localDateTimeString);
  if (isNaN(localDate.getTime())) {
    return null;
  }
  
  return localDate.toISOString();
}