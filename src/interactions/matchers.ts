import { APIApplicationCommandAutocompleteInteraction } from "discord-api-types/payloads/v9/_interactions/autocomplete";
import {
  APIApplicationCommandInteraction,
  APIApplicationCommandInteractionDataBasicOption,
  APIApplicationCommandInteractionDataOption,
} from "discord-api-types/v9";
import { ApplicationCommandType } from "../api";
import {
  AnyCommand,
  ChatInputCommands,
  MessageCommand,
  UserCommand,
} from "../commands";
import { PREFIX, ValueOf } from "../helpers";
import { HandlerOptions } from "../options";

export function matchCommand<Env>(
  interaction:
    | APIApplicationCommandInteraction
    | APIApplicationCommandAutocompleteInteraction,
  opts: HandlerOptions<Env>
): [
  commandId: string,
  command?: AnyCommand<Env>,
  options?: Map<string, APIApplicationCommandInteractionDataBasicOption>
] {
  if (!interaction.data) return ["", undefined, undefined];
  const type = interaction.data.type;
  let data: {
    name: string;
    options?: APIApplicationCommandInteractionDataOption[];
  } = interaction.data;

  // See src/commands/types.ts for an explanation of command IDs
  let id = `${PREFIX}:${type}/${data.name}`;
  let command: AnyCommand<Env> | undefined;
  if (type === ApplicationCommandType.CHAT_INPUT) {
    let cursor: ValueOf<ChatInputCommands<Env>> | undefined;
    let group = opts.commands;
    while ((cursor = group?.[data.name])) {
      if (typeof cursor === "function") {
        command = cursor;
        break;
      }
      group = cursor;
      data = data.options![0];
      id += `/${data.name}`;
    }
  } else {
    command = (
      type === ApplicationCommandType.USER
        ? opts.userCommands
        : opts.messageCommands
    )?.[data.name];
  }

  let options:
    | Map<string, APIApplicationCommandInteractionDataBasicOption>
    | undefined;
  if (command && data.options) {
    options = new Map();
    for (const option of data.options) {
      options.set(option.name, option as any);
    }
  }

  return [id, command, options];
}

export function matchCustomId<Env>(
  customId: string,
  opts: HandlerOptions<Env>
): [commandId: string, command?: AnyCommand<Env>] {
  // See src/commands/types.ts for an explanation of command IDs
  const commandId = customId.substring(0, customId.indexOf("$"));
  const locator = commandId.substring(PREFIX.length + 1);
  const parts = locator.split("/");
  const type = parseInt(parts.shift()!);
  let command:
    | ValueOf<ChatInputCommands<Env>>
    | UserCommand<Env>
    | MessageCommand<Env>
    | undefined;
  if (type === ApplicationCommandType.CHAT_INPUT) {
    command = opts.commands?.[parts.shift()!];
    let part: string | undefined;
    while (typeof command === "object" && (part = parts.shift())) {
      command = command[part];
    }
  } else {
    command = (
      type === ApplicationCommandType.USER
        ? opts.userCommands
        : opts.messageCommands
    )?.[parts[0]];
  }
  return [commandId, command as AnyCommand<Env> | undefined];
}
