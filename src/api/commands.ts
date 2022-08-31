import type {
  RESTGetAPIApplicationCommandResult,
  RESTGetAPIApplicationCommandsResult,
  RESTGetAPIApplicationGuildCommandResult,
  RESTGetAPIApplicationGuildCommandsResult,
  RESTPatchAPIApplicationCommandJSONBody,
  RESTPatchAPIApplicationCommandResult,
  RESTPatchAPIApplicationGuildCommandJSONBody,
  RESTPatchAPIApplicationGuildCommandResult,
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIApplicationCommandsResult,
  RESTPostAPIApplicationGuildCommandsJSONBody,
  RESTPostAPIApplicationGuildCommandsResult,
  RESTPutAPIApplicationCommandsJSONBody,
  RESTPutAPIApplicationCommandsResult,
  RESTPutAPIApplicationGuildCommandsJSONBody,
  RESTPutAPIApplicationGuildCommandsResult,
  Snowflake,
} from "discord-api-types/v10";
import { APIBearerAuth, call } from "./helpers";

/** @see https://discord.com/developers/docs/interactions/application-commands#get-global-application-commands */
export function getGlobalApplicationCommands(
  applicationId: Snowflake,
  auth: APIBearerAuth
): Promise<RESTGetAPIApplicationCommandsResult> {
  return call("GET", `/applications/${applicationId}/commands`, 0, auth);
}

/** @see https://discord.com/developers/docs/interactions/application-commands#create-global-application-command */
export function createGlobalApplicationCommand(
  applicationId: Snowflake,
  command: RESTPostAPIApplicationCommandsJSONBody,
  auth: APIBearerAuth
): Promise<RESTPostAPIApplicationCommandsResult> {
  return call("POST", `/applications/${applicationId}/commands`, command, auth);
}

/** @see https://discord.com/developers/docs/interactions/application-commands#get-global-application-command */
export function getGlobalApplicationCommand(
  applicationId: Snowflake,
  commandId: Snowflake,
  auth: APIBearerAuth
): Promise<RESTGetAPIApplicationCommandResult> {
  return call(
    "GET",
    `/applications/${applicationId}/commands/${commandId}`,
    0,
    auth
  );
}

/** @see https://discord.com/developers/docs/interactions/application-commands#edit-global-application-command */
export function editGlobalApplicationCommand(
  applicationId: Snowflake,
  commandId: Snowflake,
  command: RESTPatchAPIApplicationCommandJSONBody,
  auth: APIBearerAuth
): Promise<RESTPatchAPIApplicationCommandResult> {
  return call(
    "PATCH",
    `/applications/${applicationId}/commands/${commandId}`,
    command,
    auth
  );
}

/** @see https://discord.com/developers/docs/interactions/application-commands#delete-global-application-command */
export function deleteGlobalApplicationCommand(
  applicationId: Snowflake,
  commandId: Snowflake,
  auth: APIBearerAuth
): Promise<void> {
  return call(
    "DELETE",
    `/applications/${applicationId}/commands/${commandId}`,
    0,
    auth
  );
}

/** @see https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands */
export function bulkOverwriteGlobalApplicationCommands(
  applicationId: Snowflake,
  commands: RESTPutAPIApplicationCommandsJSONBody,
  auth: APIBearerAuth
): Promise<RESTPutAPIApplicationCommandsResult> {
  return call("PUT", `/applications/${applicationId}/commands`, commands, auth);
}

/** @see https://discord.com/developers/docs/interactions/application-commands#get-guild-application-commands */
export function getGuildApplicationCommands(
  applicationId: Snowflake,
  guildId: Snowflake,
  auth: APIBearerAuth
): Promise<RESTGetAPIApplicationGuildCommandsResult> {
  return call(
    "GET",
    `/applications/${applicationId}/guilds/${guildId}/commands`,
    0,
    auth
  );
}

/** @see https://discord.com/developers/docs/interactions/application-commands#create-guild-application-command */
export function createGuildApplicationCommand(
  applicationId: Snowflake,
  guildId: Snowflake,
  command: RESTPostAPIApplicationGuildCommandsJSONBody,
  auth: APIBearerAuth
): Promise<RESTPostAPIApplicationGuildCommandsResult> {
  return call(
    "POST",
    `/applications/${applicationId}/guilds/${guildId}/commands`,
    command,
    auth
  );
}

/** @see https://discord.com/developers/docs/interactions/application-commands#get-guild-application-command */
export function getGuildApplicationCommand(
  applicationId: Snowflake,
  guildId: Snowflake,
  commandId: Snowflake,
  auth: APIBearerAuth
): Promise<RESTGetAPIApplicationGuildCommandResult> {
  return call(
    "GET",
    `/applications/${applicationId}/guilds/${guildId}/commands/${commandId}`,
    0,
    auth
  );
}

/** @see https://discord.com/developers/docs/interactions/application-commands#edit-guild-application-command */
export function editGuildApplicationCommand(
  applicationId: Snowflake,
  guildId: Snowflake,
  commandId: Snowflake,
  command: RESTPatchAPIApplicationGuildCommandJSONBody,
  auth: APIBearerAuth
): Promise<RESTPatchAPIApplicationGuildCommandResult> {
  return call(
    "PATCH",
    `/applications/${applicationId}/guilds/${guildId}/commands/${commandId}`,
    command,
    auth
  );
}

/** @see https://discord.com/developers/docs/interactions/application-commands#delete-guild-application-command */
export function deleteGuildApplicationCommand(
  applicationId: Snowflake,
  guildId: Snowflake,
  commandId: Snowflake,
  auth: APIBearerAuth
): Promise<void> {
  return call(
    "DELETE",
    `/applications/${applicationId}/guilds/${guildId}/commands/${commandId}`,
    0,
    auth
  );
}

/** @see https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-guild-application-commands */
export function bulkOverwriteGuildApplicationCommands(
  applicationId: Snowflake,
  guildId: Snowflake,
  commands: RESTPutAPIApplicationGuildCommandsJSONBody,
  auth: APIBearerAuth
): Promise<RESTPutAPIApplicationGuildCommandsResult> {
  return call(
    "PUT",
    `/applications/${applicationId}/guilds/${guildId}/commands`,
    commands,
    auth
  );
}
