export interface DatabaseTag {
  _id: string;
  content: string;
}

export interface ExternalAccount {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  // todo: ditch unix
  expiresAt: number;
  name: string;
}

export interface CutieStatus {
  pledgeTier: number;
  // todo: ditch unix
  perksExpireAt: number;
  // todo: ditch unix
  lastManualRefresh?: number;
}

export interface CutiePerks {
  color: string | null;
  badge: string | null;
  title: string | null;
}

export interface User {
  _id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  flags: number;
  accounts: {
    discord: Omit<ExternalAccount, "name">;
    spotify?: ExternalAccount;
    patreon?: ExternalAccount;
  };
  cutieStatus?: CutieStatus;
  cutiePerks?: CutiePerks;
  createdAt: Date;
  updatedAt?: Date;
}
