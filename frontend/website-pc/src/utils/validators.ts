// src/utils/validators.ts
// Common validation helpers for numbers, strings, dates, and age.

/** Numeric validations */
export const isNumeric = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  return !Number.isNaN(Number(value)) && value !== "";
};

export const isInRange = (
  value: number | string,
  min?: number | null,
  max?: number | null
): boolean => {
  if (!isNumeric(value)) return false;
  const n = Number(value);
  if (min !== undefined && min !== null && n < min) return false;
  if (max !== undefined && max !== null && n > max) return false;
  return true;
};

export const isInteger = (value: any): boolean => {
  if (!isNumeric(value)) return false;
  return Number.isInteger(Number(value));
};

export const isDecimal = (value: any): boolean => {
  if (!isNumeric(value)) return false;
  const n = Number(value);
  return !Number.isInteger(n);
};

export const isPositive = (value: any): boolean => {
  if (!isNumeric(value)) return false;
  return Number(value) > 0;
};

export const isNegative = (value: any): boolean => {
  if (!isNumeric(value)) return false;
  return Number(value) < 0;
};

// Number format check using regex or Intl (simple regex example)
export const matchesNumberFormat = (value: string, regex: RegExp): boolean => {
  if (typeof value !== "string") return false;
  return regex.test(value);
};

/** String validations */
export const notEmpty = (s: any): boolean => {
  return typeof s === "string" && s.trim().length > 0;
};

export const minLength = (s: string, min: number): boolean => {
  return typeof s === "string" && s.length >= min;
};

export const maxLength = (s: string, max: number): boolean => {
  return typeof s === "string" && s.length <= max;
};

export const matchesRegex = (s: string, regex: RegExp): boolean => {
  return typeof s === "string" && regex.test(s);
};

export const allowedCharacters = (s: string, allowedRegex: RegExp): boolean => {
  return typeof s === "string" && allowedRegex.test(s);
};

/** Date validations */
export const isValidDate = (d: any): boolean => {
  if (!d) return false;
  const date = d instanceof Date ? d : new Date(String(d));
  return date instanceof Date && !Number.isNaN(date.getTime());
};

// Check simple ISO / yyyy-mm-dd or custom format by regex
export const isValidDateFormat = (s: string, regex: RegExp): boolean => {
  if (typeof s !== "string") return false;
  return regex.test(s) && isValidDate(s);
};

export const isDateInRange = (
  date: Date | string,
  start?: Date | string | null,
  end?: Date | string | null
): boolean => {
  if (!isValidDate(date)) return false;
  const t = new Date(String(date)).getTime();
  if (start && isValidDate(start) && t < new Date(String(start)).getTime())
    return false;
  if (end && isValidDate(end) && t > new Date(String(end)).getTime())
    return false;
  return true;
};

export const isStartBeforeOrEqual = (
  start: Date | string,
  end: Date | string
): boolean => {
  if (!isValidDate(start) || !isValidDate(end)) return false;
  return new Date(String(start)).getTime() <= new Date(String(end)).getTime();
};

export const isFutureDate = (d: Date | string): boolean => {
  if (!isValidDate(d)) return false;
  return new Date(String(d)).getTime() > Date.now();
};

export const isPastDate = (d: Date | string): boolean => {
  if (!isValidDate(d)) return false;
  return new Date(String(d)).getTime() < Date.now();
};

/** Age validations */
export const ageFromDOB = (dob: Date | string): number | null => {
  if (!isValidDate(dob)) return null;
  const birth = new Date(String(dob));
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

export const isAgeInRange = (
  dob: Date | string,
  min?: number | null,
  max?: number | null
): boolean => {
  const age = ageFromDOB(dob);
  if (age === null) return false;
  if (min !== undefined && min !== null && age < min) return false;
  if (max !== undefined && max !== null && age > max) return false;
  return true;
};

export const isPositiveIntegerAge = (dob: Date | string): boolean => {
  const age = ageFromDOB(dob);
  return age !== null && Number.isInteger(age) && age > 0;
};

/** Example common regexes */
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // yyyy-mm-dd
export const DDMMYYYY_REGEX = /^\d{2}\/\d{2}\/\d{4}$/; // dd/mm/yyyy

// Example usage (commented):
// isNumeric("12.3") => true
// isInRange(5, 1, 10) => true
// notEmpty("abc") => true
// isValidDateFormat("2025-12-30", ISO_DATE_REGEX) => true
// ageFromDOB("2000-01-01") => 25

export default {
  // numeric
  isNumeric,
  isInRange,
  isInteger,
  isDecimal,
  isPositive,
  isNegative,
  matchesNumberFormat,
  // string
  notEmpty,
  minLength,
  maxLength,
  matchesRegex,
  allowedCharacters,
  // date
  isValidDate,
  isValidDateFormat,
  isDateInRange,
  isStartBeforeOrEqual,
  isFutureDate,
  isPastDate,
  // age
  ageFromDOB,
  isAgeInRange,
  isPositiveIntegerAge,
};
