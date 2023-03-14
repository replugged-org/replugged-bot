import { Jsonifiable } from 'type-fest';

export function idFromMention(string: string): `${bigint}` | null {
  if (string.endsWith('>')) {
    if (string.startsWith('<@!') || string.startsWith('<@&'))
      string = string.slice(3, -1);
    if (string.startsWith('<@') || string.startsWith('<#'))
      string = string.slice(2, -1);
  }

  if (!/^[0-9]+$/.test(string)) return null;
  return `${BigInt(string)}`;
}

// Check if string follows user mention format or ID
// <@ID> or <@!ID> or ID
export function isUser(string: string): boolean {
  if (string.startsWith('<@!')) string = string.slice(3);
  if (string.startsWith('<@')) string = string.slice(3);
  if (string.endsWith('>')) string = string.slice(0, -1);
  return /^[0-9]+$/.test(string);
}

// Turn array of IDs into snowflake IDs (`${bigint}`)
export function idsToSnowflakes(ids: string[]): (`${bigint}` | null)[] {
  return ids.map((id: string) => idToSnowflake(id));
}

// Turn single ID into snowflake IDs (`${bigint}`)
export function idToSnowflake(id: string): `${bigint}` | null {
  try {
    return `${BigInt(id)}`;
  } catch (e) {
    return null;
  }
}

// Format a number as K, M, or B and add commas
export function formatNumber(num: number | string): string {
  if (typeof num === 'string') num = parseInt(num);
  const addT = num > 999999999999;
  const tnumber = (Math.abs(num) / 1000000000000).toFixed(1);
  const addB = num > 999999999;
  const bnumber = (Math.abs(num) / 1000000000).toFixed(1);
  const addM = num > 999999;
  const mnumber = (Math.abs(num) / 1000000).toFixed(1);
  const addK = num > 9999;
  const knumber = (Math.abs(num) / 1000).toFixed(1);
  if (addT) {
    return (
      tnumber.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + 'T'
    );
  } else if (addB) {
    return (
      bnumber.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + 'B'
    );
  } else if (addM) {
    return (
      mnumber.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + 'M'
    );
  } else if (addK) {
    return (
      knumber.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + 'K'
    );
  } else {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  }
}

// Add commas to number
export function comma(num: number | string): string {
  if (typeof num === 'string') num = parseInt(num);
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

// Generate a random number
export function makeId(len: number) {
  let text = '';
  const char_list = '0123456789';
  for (let i = 0; i < len; i += 1) {
    text += char_list.charAt(Math.floor(Math.random() * char_list.length));
  }
  return text;
}

interface MyObject {
  [key: string | number | symbol]: MyObject
}
export function isJSONEqual(...objects: MyObject[]): boolean {
  const keys = Object.keys(objects[0]);
  // Check if objects have the same keys
  if (
    objects.some(
      obj =>
        keys.some(key => !Object.keys(obj).includes(key)) ||
				Object.keys(obj).some(key => !keys.includes(key)),
    )
  )
    return false;
  // Check if objects have the same values
  return objects.every(obj =>
    keys.every(
      key =>
        typeof obj[key] === typeof objects[0][key] &&
				(typeof obj[key] == 'object' && obj[key] && objects[0][key]
				  ? isJSONEqual(obj[key], objects[0][key])
				  : obj[key] === objects[0][key]),
    ),
  );
}