import type {
  APIEmbed,
  APIEmbedAuthor,
  APIEmbedField,
  APIEmbedFooter,
  APIEmbedImage,
  APIEmbedProvider,
} from "discord-api-types/v10";
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

function normaliseFooter(
  props?: string | EmbedFooterProps
): APIEmbedFooter | undefined {
  if (!props) return;
  if (typeof props === "string") return { text: props };
  return {
    text: props.text,
    icon_url: props.iconUrl,
    proxy_icon_url: props.proxyIconUrl,
  };
}

function normaliseProvider(
  props?: string | EmbedProviderProps
): APIEmbedProvider | undefined {
  return typeof props === "string" ? { name: props } : props;
}

function normaliseAuthor(
  props?: string | EmbedAuthorProps
): APIEmbedAuthor | undefined {
  if (!props) return;
  if (typeof props === "string") return { name: props };
  return {
    name: props.name,
    url: props.url,
    icon_url: props.iconUrl,
    proxy_icon_url: props.proxyIconUrl,
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

    footer: normaliseFooter(props.footer),
    provider: normaliseProvider(props.provider),
    author: normaliseAuthor(props.author),

    fields,
  };
}
