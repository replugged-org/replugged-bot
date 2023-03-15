export function idFromMention(string: string): `${bigint}` | null {
  if (string.endsWith(">")) {
    if (string.startsWith("<@!") || string.startsWith("<@&")) string = string.slice(3, -1);
    if (string.startsWith("<@") || string.startsWith("<#")) string = string.slice(2, -1);
  }

  if (!/^[0-9]+$/.test(string)) return null;
  return `${BigInt(string)}`;
}

// Check if string follows user mention format or ID
// <@ID> or <@!ID> or ID
export function isUser(string: string): boolean {
  if (string.startsWith("<@!")) string = string.slice(3);
  if (string.startsWith("<@")) string = string.slice(3);
  if (string.endsWith(">")) string = string.slice(0, -1);
  return /^[0-9]+$/.test(string);
}

// Turn array of IDs into snowflake IDs (`${bigint}`)
export function idsToSnowflakes(ids: string[]): Array<`${bigint}` | null> {
  return ids.map((id: string) => idToSnowflake(id));
}

// Turn single ID into snowflake IDs (`${bigint}`)
export function idToSnowflake(id: string): `${bigint}` | null {
  try {
    return `${BigInt(id)}`;
  } catch {
    return null;
  }
}
