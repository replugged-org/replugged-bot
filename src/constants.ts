export const IDS: {
  server: string,
  channels: {
    [key: string]: string
  },
  roles: {
    [key: string]: string
  },
  flagRoles: {
    [key in UserFlagKeys | '_']?: string
  }
} = {
  server: '1000926524452647132',
  channels: {
  //  welcome: '1000955951500759130',
    rules: '1000955949013553253',
    faq: '1000955952494813204',
    starboard: '1000955984325382284'
  },
  roles: {
    forg: '1001323983171489792'
  },
  flagRoles: {
    CONTRIBUTOR: '1000955919141703690',
    SERVER_BOOSTER: '1001124337002229842',
    TRANSLATOR: '1000955920009928764',
    BUG_HUNTER: '1000955924430717018',
    EARLY_USER: '1003068171625959434',
    _: '1000955925542207538'
  }
};

export const MESSAGES = {
  welcome: 'Hello %user and welcome to Replugged! Please make sure to read %rules and %faq.'
};

// Visibility:
//  - Public: disclosed via API
//  - Private: internal/staff only

export const UserFlags = {
  // Developer status. Public
  DEVELOPER: 1 << 0,
  // Admin status. Public
  ADMIN: 1 << 1,
  // Staff status. Public
  STAFF: 1 << 2,
  // Moderator status. Public
  MODERATOR: 1 << 3,
  // Support status. Public
  SUPPORT: 1 << 4,
  // Contributor status. Public
  CONTRIBUTOR: 1 << 5,
  // Translator status. Public
  TRANSLATOR: 1 << 6,
  // Bug hunter status. Public
  BUG_HUNTER: 1 << 7,
  // Early user status. Public
  EARLY_USER: 1 << 8,

  // User donated at least once. Public.
  HAS_DONATED: 1 << 9,
  // User is currently a Powercord Cutie. Public.
  IS_CUTIE: 1 << 10,
  // Status has been manually set by a staff. Private.
  CUTIE_OVERRIDE: 1 << 11,

  // User currently has a published item in the store. Public.
  STORE_PUBLISHER: 1 << 12,
  // User has at least one verified item in the store. Public.
  VERIFIED_PUBLISHER: 1 << 13,

  // User is banned from logging in. Private.
  BANNED: 1 << 14,
  // User is banned from publishing in the store. Private.
  BANNED_PUBLISHER: 1 << 15,
  // User is banned from requesting verification. Private.
  BANNED_VERIFICATION: 1 << 16,
  // User is banned from requesting hosting. Private.
  BANNED_HOSTING: 1 << 17,
  // User is banned from submitting reports. Private.
  BANNED_REPORTING: 1 << 18,
  // User is banned from using Sync. Private.
  BANNED_SYNC: 1 << 19,
  // User is banned from participating in community events. Private.
  BANNED_EVENTS: 1 << 20,

  // User appealed a support ban. Private.
  APPEALED_SUPPORT: 1 << 21,
  // User appealed a server mute. Private.
  APPEALED_MUTE: 1 << 22,
  // User appealed a server ban. Private.
  APPEALED_BAN: 1 << 23,
  // User appealed a Sync ban. Private.
  APPEALED_SYNC: 1 << 24,
  // User appealed a community events ban. Private.
  APPEALED_EVENTS: 1 << 25,

  // User is a ghost entry (entry with no real user data, used for flag keeping purposes). Private.
  GHOST: 1 << 26,

  // User boosted the support server. Public
  SERVER_BOOSTER: 1 << 27,
};

export type UserFlagKeys = keyof typeof UserFlags;
export type UserFlagsValues = typeof UserFlags[UserFlagKeys];

export const UserFlagsText: {[k: UserFlagsValues]: string} = {
  [UserFlags.DEVELOPER]: 'Developer',
  [UserFlags.ADMIN]: 'Admin',
  [UserFlags.STAFF]: 'Staff',
  [UserFlags.MODERATOR]: 'Moderator',
  [UserFlags.SUPPORT]: 'Support',
  [UserFlags.CONTRIBUTOR]: 'Contributor',
  [UserFlags.TRANSLATOR]: 'Translator',
  [UserFlags.BUG_HUNTER]: 'Bug Hunter',
  [UserFlags.EARLY_USER]: 'Early User',
  [UserFlags.HAS_DONATED]: 'Has Donated',
  [UserFlags.IS_CUTIE]: 'Cutie',
  [UserFlags.CUTIE_OVERRIDE]: 'Cutie Override',
  [UserFlags.STORE_PUBLISHER]: 'Store Publisher',
  [UserFlags.VERIFIED_PUBLISHER]: 'Verified Publisher',
  [UserFlags.BANNED]: 'Banned',
  [UserFlags.BANNED_PUBLISHER]: 'Banned Publisher',
  [UserFlags.BANNED_VERIFICATION]: 'Banned Verification',
  [UserFlags.BANNED_HOSTING]: 'Banned Hosting',
  [UserFlags.BANNED_REPORTING]: 'Banned Reporting',
  [UserFlags.BANNED_SYNC]: 'Banned Sync',
  [UserFlags.BANNED_EVENTS]: 'Banned Events',
  [UserFlags.APPEALED_SUPPORT]: 'Appealed Support',
  [UserFlags.APPEALED_MUTE]: 'Appealed Mute',
  [UserFlags.APPEALED_BAN]: 'Appealed Ban',
  [UserFlags.APPEALED_SYNC]: 'Appealed Sync',
  [UserFlags.APPEALED_EVENTS]: 'Appealed Events',
  [UserFlags.GHOST]: 'Ghost',
  [UserFlags.SERVER_BOOSTER]: 'Server Booster'
};

export const UserFlagsArray: {
  key: UserFlagKeys,
  value: UserFlagsValues,
  label: string
}[] = Object.entries(UserFlags).map(([key, value]) => ({
  key: key as UserFlagKeys,
  value: value as UserFlagsValues,
  label: UserFlagsText[value as UserFlagsValues]
}));

export const GITHUB_RGX = /https?:\/\/github\.com\/([\w\.-]+\/[\w\.-]+)/g;