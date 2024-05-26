/**
 * Truncates a string at the last occurrence of a space, comma, Arabic comma,
 * or period within a specified maximum length, ensuring a natural break point
 * for readability.
 * @param value The string to be truncated
 * @returns The truncated string
 */
export function truncateValue(value: string): string {
  const maxLength = 50;

  if (value.length <= maxLength) {
    return value;
  }

  // Find the last space, comma, or dot within the first 50 characters
  const temporaryValue = value.slice(0, maxLength);
  const lastSuitableIndex = Math.max(
    temporaryValue.lastIndexOf(" "),
    temporaryValue.lastIndexOf(","),
    temporaryValue.lastIndexOf("،"),
    temporaryValue.lastIndexOf(".")
  );

  const truncatedValue = value.slice(
    0,
    lastSuitableIndex === -1 ? maxLength : lastSuitableIndex
  );

  return truncatedValue;
}
