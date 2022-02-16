import {
  APIInteraction,
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionResponseDeferredChannelMessageWithSource,
  APIInteractionResponseDeferredMessageUpdate,
  APIInteractionResponseUpdateMessage,
  APIModalInteractionResponse,
  APIModalSubmitInteraction,
} from "discord-api-types";
import {
  InteractionResponseType,
  createFollowupMessage,
  editOriginalInteractionResponse,
} from "../api";
import {
  $update,
  CommandResponse,
  ComponentHandlerResponse,
  isModalResponse,
} from "../commands";
import { extractAttachments, isGenerator, jsonResponse } from "../helpers";
import { HandlerOptions } from "../options";

export async function transformResponse<Env>(
  interaction: APIInteraction | APIModalSubmitInteraction,
  opts: HandlerOptions<Env>,
  ctx: ExecutionContext,
  res: CommandResponse | ComponentHandlerResponse
): Promise<Response> {
  res = await res;
  if (isGenerator(res)) {
    const yieldRes = await res.next();
    if (!yieldRes.done) {
      // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE | DEFERRED_UPDATE_MESSAGE
      const update = yieldRes.value === $update;
      const resType = update
        ? InteractionResponseType.DEFERRED_MESSAGE_UPDATE
        : InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE;

      const deferredPromise = Promise.resolve(res.next()).then((res) => {
        if (!res.done) throw new Error("Response can only be deferred once");
        return (
          update ? editOriginalInteractionResponse : createFollowupMessage
        )(opts.applicationId, interaction.token, res.value);
      });
      ctx.waitUntil(deferredPromise);

      return jsonResponse<
        | APIInteractionResponseDeferredChannelMessageWithSource
        | APIInteractionResponseDeferredMessageUpdate
      >({ type: resType });
    }
    // If we never yielded in the generator, treat as a normal function call
    res = yieldRes.value;
  }

  // MODAL
  if (isModalResponse(res)) {
    return jsonResponse<APIModalInteractionResponse>({
      type: InteractionResponseType.MODAL,
      data: res,
    });
  }

  // CHANNEL_MESSAGE_WITH_SOURCE | UPDATE_MESSAGE
  const [newBody, formData] = extractAttachments(res);
  const resType = (res as any)[$update]
    ? InteractionResponseType.UPDATE_MESSAGE
    : InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE;
  return jsonResponse<
    | APIInteractionResponseChannelMessageWithSource
    | APIInteractionResponseUpdateMessage
  >({ type: resType, data: newBody }, formData);
}
