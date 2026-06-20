/**
 * Input validation utilities for controlled form inputs.
 *
 * These functions validate the *entire* new value of an input field.
 * They are designed to be used inside onChange handlers to reject
 * keystrokes that would introduce invalid characters — the invalid
 * character never appears in the rendered input.
 *
 * Each function returns `true` when the value is acceptable
 * (including the empty string, so the user can clear the field).
 */

/**
 * Returns true if the value contains only digits (0-9) or is empty.
 * Use for: integer amounts (VND), phone numbers, ID numbers,
 *          numeric apartment numbers.
 *
 * Rejects: letters, whitespace, decimal points, signs, special characters.
 */
export const isDigitsOnly = (value) => /^\d*$/.test(value);

/**
 * Returns true if the value contains only English letters (a-z, A-Z)
 * and spaces, or is empty.
 * Use for: English-only resident / person names.
 *
 * Rejects: digits, special characters, accented characters,
 *          Vietnamese diacritics, and other non-ASCII symbols.
 */
export const isEnglishTextOnly = (value) => /^[a-zA-Z\s]*$/.test(value);
