import type { Db } from 'mongodb';

declare module 'eris' {
  interface CommandClient {
    mango: Db
  }

  interface Guild {
    _client: CommandClient
  }

  interface User {
    _client: CommandClient
  }

  interface Message {
    _client: CommandClient
  }

  interface GuildPreview {
    _client: CommandClient
  }

  interface Command {
    _client: CommandClient
  }
}