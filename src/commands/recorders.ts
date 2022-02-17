import type {
  APIApplicationCommand,
  APIApplicationCommandOption,
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from "discord-api-types/v9";
import { ApplicationCommandOptionType, ApplicationCommandType } from "../api";
import { PREFIX } from "../helpers";
import { Options } from "../options";
import { STATE } from "./state";
import {
  ChatInputCommands,
  Command,
  MessageCommands,
  UserCommands,
} from "./types";

function validateName(name: string): void {
  // Make sure command names don't include any characters we use in custom IDs
  // for message components
  if (/[:/$#]/.test(name)) {
    throw new RangeError(
      `Command name "${name}" must not contain ':', '/', '$' or '#' characters`
    );
  }
}

function recordCommand<Env>(
  commandId: string,
  name: string,
  command: Command<Env>,
  requireDescription = true
): Pick<
  APIApplicationCommand,
  "name" | "description" | "options" | "default_permission"
> {
  STATE.commandId = commandId;
  STATE.recordingOptions = [];
  STATE.recordingDescription = "";
  STATE.recordingDefaultPermission = undefined;
  STATE.componentHandlerCount = 0;
  try {
    // Run hooks and record options
    command();

    // Validate description if required
    if (requireDescription && !STATE.recordingDescription) {
      throw new TypeError(
        `Command "${name}" must call useDescription("...") with a non-empty string`
      );
    }

    return {
      name,
      description: STATE.recordingDescription,
      options: STATE.recordingOptions.length
        ? STATE.recordingOptions
        : undefined,
      default_permission: STATE.recordingDefaultPermission,
    };
  } finally {
    STATE.commandId = undefined;
    STATE.recordingOptions = undefined;
  }
}

function recordChatInputCommands<Env>(
  commands: ChatInputCommands<Env>
): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
  // See src/commands/types.ts for an explanation of command IDs
  const results: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
  const type = ApplicationCommandType.CHAT_INPUT;
  for (const [name, command] of Object.entries(commands)) {
    validateName(name);
    if (typeof command === "function") {
      const id = `${PREFIX}:${type}/${name}`;
      results.push(recordCommand(id, name, command));
    } else {
      let defaultPermission = true;
      const commandOptions: APIApplicationCommandOption[] = [];
      for (const [subGroupName, subGroupCommand] of Object.entries(command)) {
        validateName(subGroupName);
        if (typeof subGroupCommand === "function") {
          const id = `${PREFIX}:${type}/${name}/${subGroupName}`;
          const cmd = recordCommand(id, subGroupName, subGroupCommand);
          // noinspection PointlessBooleanExpressionJS
          if (cmd.default_permission === false) defaultPermission = false;
          delete cmd.default_permission;
          commandOptions.push({
            type: ApplicationCommandOptionType.SUB_COMMAND,
            ...cmd,
          });
        } else {
          const subGroupCommandOptions: APIApplicationCommandOption[] = [];
          for (const [subCommandName, subCommand] of Object.entries(
            subGroupCommand
          )) {
            validateName(subCommandName);
            const id = `${PREFIX}:${type}/${name}/${subGroupName}/${subCommandName}`;
            const cmd = recordCommand(id, subCommandName, subCommand);
            // noinspection PointlessBooleanExpressionJS
            if (cmd.default_permission === false) defaultPermission = false;
            delete cmd.default_permission;
            subGroupCommandOptions.push({
              type: ApplicationCommandOptionType.SUB_COMMAND,
              ...cmd,
            });
          }
          commandOptions.push({
            type: ApplicationCommandOptionType.SUB_COMMAND_GROUP,
            name: subGroupName,
            description: subGroupName,
            options: subGroupCommandOptions as any,
          });
        }
      }
      results.push({
        name,
        description: name,
        options: commandOptions,
        default_permission: defaultPermission ? undefined : false,
      });
    }
  }
  return results;
}

function recordContextMenuCommands<Env>(
  type:
    | typeof ApplicationCommandType.USER
    | typeof ApplicationCommandType.MESSAGE,
  commands: UserCommands<Env> | MessageCommands<Env>
) {
  const results: RESTPostAPIContextMenuApplicationCommandsJSONBody[] = [];
  for (const [name, command] of Object.entries(commands)) {
    validateName(name);
    const id = `${PREFIX}:${type}/${name}`;
    // `false` means description isn't required
    results.push({ type, ...recordCommand(id, name, command, false) });
  }
  return results;
}

export function recordCommands<Env>(
  opts: Pick<Options<Env>, "commands" | "userCommands" | "messageCommands">
): RESTPostAPIApplicationCommandsJSONBody[] {
  const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];
  if (opts.commands) {
    commands.push(...recordChatInputCommands(opts.commands));
  }
  if (opts.userCommands) {
    commands.push(
      ...recordContextMenuCommands(
        ApplicationCommandType.USER,
        opts.userCommands
      )
    );
  }
  if (opts.messageCommands) {
    commands.push(
      ...recordContextMenuCommands(
        ApplicationCommandType.MESSAGE,
        opts.messageCommands
      )
    );
  }
  return commands;
}
