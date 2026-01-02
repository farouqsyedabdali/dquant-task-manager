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
