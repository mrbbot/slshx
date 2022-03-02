import type { Snowflake } from "discord-api-types/v9";
import type {
  ChatInputCommands,
  MessageCommands,
  UserCommands,
} from "./commands"; // circular

export interface Options<Env = unknown> {
  applicationId?: Snowflake;
  applicationPublicKey?: string;
  applicationSecret?: string;
  testServerId?: Snowflake;
  commands?: ChatInputCommands<Env>;
  userCommands?: UserCommands<Env>;
  messageCommands?: MessageCommands<Env>;
  skipKeyValidation?: boolean;
}

export type HandlerOptions<Env> = Omit<Options<Env>, "applicationId"> &
  Required<Pick<Options<Env>, "applicationId">>;
