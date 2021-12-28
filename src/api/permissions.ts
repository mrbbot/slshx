import type {
  RESTGetAPIApplicationCommandPermissionsResult,
  RESTGetAPIGuildApplicationCommandsPermissionsResult,
  RESTPutAPIApplicationCommandPermissionsJSONBody,
  RESTPutAPIApplicationCommandPermissionsResult,
  Snowflake,
} from "discord-api-types/v9";
import { APIBearerAuth, call } from "./helpers";

/** @see https://discord.com/developers/docs/interactions/application-commands#get-guild-application-command-permissions */
export function getGuildApplicationCommandPermissions(
  applicationId: Snowflake,
  guildId: Snowflake,
  auth: APIBearerAuth
): Promise<RESTGetAPIGuildApplicationCommandsPermissionsResult> {
  return call(
    "GET",
    `/applications/${applicationId}/guilds/${guildId}/commands/permissions`,
    0,
    auth
  );
}

/** @see https://discord.com/developers/docs/interactions/application-commands#get-application-command-permissions */
export function getApplicationCommandPermissions(
  applicationId: Snowflake,
  guildId: Snowflake,
  commandId: Snowflake,
  auth: APIBearerAuth
): Promise<RESTGetAPIApplicationCommandPermissionsResult> {
  return call(
    "GET",
    `/applications/${applicationId}/guilds/${guildId}/commands/${commandId}/permissions`,
    0,
    auth
  );
}

/** @see https://discord.com/developers/docs/interactions/application-commands#edit-application-command-permissions */
export function editApplicationCommandPermissions(
  applicationId: Snowflake,
  guildId: Snowflake,
  commandId: Snowflake,
  permissions: RESTPutAPIApplicationCommandPermissionsJSONBody,
  auth: APIBearerAuth
): Promise<RESTPutAPIApplicationCommandPermissionsResult> {
  return call(
    "PUT",
    `/applications/${applicationId}/guilds/${guildId}/commands/${commandId}/permissions`,
    permissions,
    auth
  );
}

/** @see https://discord.com/developers/docs/interactions/application-commands#batch-edit-application-command-permissions */
export function bulkEditApplicationCommandPermissions(
  applicationId: Snowflake,
  guildId: Snowflake,
  permissions: RESTPutAPIApplicationCommandPermissionsJSONBody,
  auth: APIBearerAuth
): Promise<RESTPutAPIApplicationCommandPermissionsResult> {
  return call(
    "PUT",
    `/applications/${applicationId}/guilds/${guildId}/commands/permissions`,
    permissions,
    auth
  );
}
