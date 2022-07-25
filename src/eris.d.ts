import { CommandClient } from 'eris';

declare module 'eris' {

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