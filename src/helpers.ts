import { GuildMember, Role } from "discord.js";
import { IDS, UserFlags } from "./constants.js";
import { existsSync, mkdirSync } from "fs";
import path from "path";

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

/**
 * @param flag the replugged flag that the member has
 * @param member the replugged guild member
 *
 * @returns a list of role ids that the member needs to add/remove
 */
export function validateFlags(flag: number, member: GuildMember): Array<[boolean, Role]> {
  const roles = member.roles.cache;

  const toggleRoles: Array<[boolean, string]> = [];

  // Check if the member has the flag but doesn't have role OR check if member has role but doesn't have the flag
  if (
    roles.has(IDS.flagRoles.CONTRIBUTOR!) !==
    ((flag & UserFlags.CONTRIBUTOR) === UserFlags.CONTRIBUTOR)
  ) {
    toggleRoles.push([roles.has(IDS.flagRoles.CONTRIBUTOR!), IDS.flagRoles.CONTRIBUTOR!]);
  }
  if (
    roles.has(IDS.flagRoles.SERVER_BOOSTER!) !==
    ((flag & UserFlags.SERVER_BOOSTER) === UserFlags.SERVER_BOOSTER)
  ) {
    toggleRoles.push([roles.has(IDS.flagRoles.SERVER_BOOSTER!), IDS.flagRoles.SERVER_BOOSTER!]);
  }
  if (
    roles.has(IDS.flagRoles.TRANSLATOR!) !==
    ((flag & UserFlags.TRANSLATOR) === UserFlags.TRANSLATOR)
  ) {
    toggleRoles.push([roles.has(IDS.flagRoles.TRANSLATOR!), IDS.flagRoles.TRANSLATOR!]);
  }
  if (
    roles.has(IDS.flagRoles.BUG_HUNTER!) !==
    ((flag & UserFlags.BUG_HUNTER) === UserFlags.BUG_HUNTER)
  ) {
    toggleRoles.push([roles.has(IDS.flagRoles.BUG_HUNTER!), IDS.flagRoles.BUG_HUNTER!]);
  }
  if (
    roles.has(IDS.flagRoles.EARLY_USER!) !==
    ((flag & UserFlags.EARLY_USER) === UserFlags.EARLY_USER)
  ) {
    toggleRoles.push([roles.has(IDS.flagRoles.EARLY_USER!), IDS.flagRoles.EARLY_USER!]);
  }
  if (!roles.has(IDS.flagRoles._!)) {
    toggleRoles.push([roles.has(IDS.flagRoles._!), IDS.flagRoles._!]);
  }

  const guildRoles = toggleRoles.map(([hasRole, roleId]) => [
    hasRole,
    member.guild.roles.cache.get(roleId),
  ]) as Array<[boolean, Role]>;

  return guildRoles;
}

/**
 * Creates the dir to a file specified
 * @param file the file to create
 */
export function createDirForFile(file: string): void {
  const dir = path.dirname(file);
  if (existsSync(dir)) return;
  mkdirSync(dir, {
    recursive: true,
  });
}
