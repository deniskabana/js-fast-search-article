/**
 * Sanitizes a string by removing leading/trailing whitespace, normalizing accented characters, and converting to lowercase.
 * @param str - The string to sanitize.
 * @returns The sanitized string or null if the input is null or undefined.
 */
export const sanitizeString = (str: string | number | undefined | null): string | null => {
  if (str === null || str === undefined) return null

  return (
    String(str)
      .trim()
      // normalize accented characters
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  )
}

/**
 * Parses a query string and returns an array of strings.
 * @param query - The query string to parse.
 * @returns An array of strings representing the parsed query.
 */
export const parseQuery = (query: string): string[] => {
  const sanitizedQuery = sanitizeString(query)
  return sanitizedQuery ? sanitizedQuery.split(' ') : []
}
