import type { APIInteractionResponsePong } from "discord-api-types/v10";
import { InteractionResponseType } from "../api";
import { jsonResponse } from "../helpers";

export function handlePingInteraction(): Response {
  return jsonResponse<APIInteractionResponsePong>({
    type: InteractionResponseType.PONG,
  });
}
