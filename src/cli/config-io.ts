/**
 * Strip JSON comments and trailing commas from a string.
 * Supports both single-line and block comment syntax.
 */
export function stripJsonComments(str: string): string {
  let result = '';
  let i = 0;
  const len = str.length;
  let inString = false;
  let stringChar = '';
  let inBlockComment = false;
  let inLineComment = false;

  while (i < len) {
    const char = str[i];
    const next = str[i + 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
        result += char;
      }
      i++;
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    if (inString) {
      result += char;
      if (char === '\\') {
        i++;
        if (i < len) result += str[i];
      } else if (char === stringChar) {
        inString = false;
      }
      i++;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      result += char;
      i++;
      continue;
    }

    if (char === '/' && next === '/') {
      inLineComment = true;
      i += 2;
      continue;
    }

    if (char === '/' && next === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }

    // Skip trailing commas before } or ]
    if (char === ',' && (next === '}' || next === ']')) {
      i++;
      continue;
    }

    result += char;
    i++;
  }

  return result;
}