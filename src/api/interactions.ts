import type {
  RESTGetAPIInteractionFollowupResult,
  RESTGetAPIInteractionOriginalResponseResult,
  RESTPatchAPIInteractionFollowupResult,
  RESTPatchAPIInteractionOriginalResponseJSONBody,
  RESTPatchAPIInteractionOriginalResponseResult,
  RESTPostAPIInteractionFollowupJSONBody,
  RESTPostAPIInteractionFollowupResult,
  Snowflake,
} from "discord-api-types/v10";
import {
  WithFileAttachments,
  extractAttachments,
  mergeFormData,
} from "../helpers";
import { call } from "./helpers";

/** @see https://discord.com/developers/docs/interactions/receiving-and-responding#get-original-interaction-response */
export function getOriginalInteractionResponse(
  applicationId: Snowflake,
  interactionToken: string
): Promise<RESTGetAPIInteractionOriginalResponseResult> {
  return call(
    "GET",
    `/webhooks/${applicationId}/${interactionToken}/messages/@original`
  );
}

/** @see https://discord.com/developers/docs/interactions/receiving-and-responding#edit-original-interaction-response */
export function editOriginalInteractionResponse(
  applicationId: Snowflake,
  interactionToken: string,
  message: WithFileAttachments<RESTPatchAPIInteractionOriginalResponseJSONBody>
): Promise<RESTPatchAPIInteractionOriginalResponseResult> {
  const body = mergeFormData(...extractAttachments(message));
  return call(
    "PATCH",
    `/webhooks/${applicationId}/${interactionToken}/messages/@original`,
    body
  );
}

/** @see https://discord.com/developers/docs/interactions/receiving-and-responding#delete-original-interaction-response */
export function deleteOriginalInteractionResponse(
  applicationId: Snowflake,
  interactionToken: string
): Promise<void> {
  return call(
    "DELETE",
    `/webhooks/${applicationId}/${interactionToken}/messages/@original`
  );
}

/** @see https://discord.com/developers/docs/interactions/receiving-and-responding#create-followup-message */
export function createFollowupMessage(
  applicationId: Snowflake,
  interactionToken: string,
  message: WithFileAttachments<RESTPostAPIInteractionFollowupJSONBody>
): Promise<RESTPostAPIInteractionFollowupResult> {
  const body = mergeFormData(...extractAttachments(message));
  return call("POST", `/webhooks/${applicationId}/${interactionToken}`, body);
}

/** @see https://discord.com/developers/docs/interactions/receiving-and-responding#get-followup-message */
export function getFollowupMessage(
  applicationId: Snowflake,
  interactionToken: string,
  messageId: Snowflake
): Promise<RESTGetAPIInteractionFollowupResult> {
  return call(
    "GET",
    `/webhooks/${applicationId}/${interactionToken}/messages/${messageId}`
  );
}

/** @see https://discord.com/developers/docs/interactions/receiving-and-responding#edit-followup-message */
export function editFollowupMessage(
  applicationId: Snowflake,
  interactionToken: string,
  messageId: Snowflake,
  message: WithFileAttachments<RESTPatchAPIInteractionFollowupResult>
): Promise<RESTPatchAPIInteractionFollowupResult> {
  const body = mergeFormData(...extractAttachments(message));
  return call(
    "PATCH",
    `/webhooks/${applicationId}/${interactionToken}/messages/${messageId}`,
    body
  );
}

/** @see https://discord.com/developers/docs/interactions/receiving-and-responding#delete-followup-message */
export function deleteFollowupMessage(
  applicationId: Snowflake,
  interactionToken: string,
  messageId: Snowflake
): Promise<void> {
  return call(
    "DELETE",
    `/webhooks/${applicationId}/${interactionToken}/messages/${messageId}`
  );
}
