import type {
  APIEmbed,
  APIInteractionResponseCallbackData,
} from "discord-api-types/v9";
import { $update, WithFileAttachments } from "../../src";

export type APIMessage =
  WithFileAttachments<APIInteractionResponseCallbackData> & {
    [$update]?: boolean;
  };

export const emptyMessage: APIMessage = {
  [$update]: undefined,
  content: undefined,
  embeds: [],
  components: [],
  attachments: undefined,
  tts: undefined,
  flags: undefined,
  allowed_mentions: undefined,
};

export const emptyEmbed: APIEmbed = {
  title: undefined,
  description: undefined,
  url: undefined,
  timestamp: undefined,
  color: undefined,
  image: undefined,
  thumbnail: undefined,
  video: undefined,
  footer: undefined,
  provider: undefined,
  author: undefined,
  fields: [],
};
