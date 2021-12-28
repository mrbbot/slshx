import type {
  APIEmbed,
  APIEmbedField,
  APIEmbedImage,
} from "discord-api-types/v9";
import { Child, isEmptyChild } from "../helpers";
import { $field } from "./Field";

export const $embed = /* @__PURE__ */ Symbol("$embed");

export interface EmbedFooterProps {
  text: string;
  iconUrl?: string;
  proxyIconUrl?: string;
}

export interface EmbedMediaProps {
  url?: string;
  proxyUrl?: string;
  width?: number;
  height?: number;
}

export interface EmbedProviderProps {
  name?: string;
  url?: string;
}

export interface EmbedAuthorProps {
  name: string;
  url?: string;
  iconUrl?: string;
  proxyIconUrl?: string;
}

export interface EmbedProps {
  title?: string;
  url?: string;
  timestamp?: string | Date;
  color?: number;

  image?: string | EmbedMediaProps; // Just URL or full image
  thumbnail?: string | EmbedMediaProps; // Just URL or full thumbnail
  video?: string | EmbedMediaProps; // Just URL or full video

  footer?: string | EmbedFooterProps; // Just text or full footer
  provider?: string | EmbedProviderProps; // Just name or full provider
  author?: string | EmbedAuthorProps; // Just name or full author

  children?: (Child | (APIEmbedField & { [$field]: true }))[]; // For description and embeds
}

function normaliseMedia(
  props?: string | EmbedMediaProps
): APIEmbedImage | undefined {
  if (!props) return;
  if (typeof props === "string") return { url: props };
  return {
    url: props.url as any,
    proxy_url: props.proxyUrl,
    width: props.width,
    height: props.height,
  };
}

export function Embed(props: EmbedProps): APIEmbed & { [$embed]: true } {
  let description = undefined;
  const fields: APIEmbedField[] = [];
  for (const child of props.children?.flat(Infinity) ?? []) {
    if (isEmptyChild(child)) continue;
    if ((child as any)[$field]) {
      fields.push(child as any);
    } else {
      description ??= "";
      description += child;
    }
  }

  return {
    [$embed]: true,
    title: props.title,
    description,
    url: props.url,
    timestamp: props.timestamp
      ? typeof props.timestamp === "string"
        ? props.timestamp
        : props.timestamp.toISOString()
      : undefined,
    color: props.color,

    image: normaliseMedia(props.image),
    thumbnail: normaliseMedia(props.thumbnail),
    video: normaliseMedia(props.video),

    footer:
      typeof props.footer === "string" ? { text: props.footer } : props.footer,
    provider:
      typeof props.provider === "string"
        ? { name: props.provider }
        : props.provider,
    author:
      typeof props.author === "string" ? { name: props.author } : props.author,

    fields,
  };
}
