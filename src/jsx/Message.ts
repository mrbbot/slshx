import type {
  APIActionRowComponent,
  APIButtonComponent,
  APIEmbed,
  APIInteractionResponseCallbackData,
  APISelectMenuComponent,
  Snowflake,
} from "discord-api-types/v9";
import { AllowedMentionsTypes, ComponentType } from "../api";
import { $update } from "../commands";
import { ValueOf, WithFileAttachments } from "../helpers";
import { $actionRow, $actionRowChild } from "./components";
import { $embed } from "./embeds";
import { Child, isEmptyChild } from "./helpers";

export interface AllowedMentionsProps {
  parse?: ValueOf<typeof AllowedMentionsTypes>[];
  roles?: Snowflake[];
  users?: Snowflake[];
  repliedUser?: boolean;
}

export interface MessageProps {
  update?: boolean;
  attachments?: File[];
  tts?: boolean;
  ephemeral?: boolean;
  allowedMentions?: AllowedMentionsProps;
  children?: (
    | Child
    | (APIEmbed & { [$embed]: true })
    | (APIActionRowComponent & { [$actionRow]: true })
    | (APIButtonComponent & { [$actionRowChild]: true })
    | (APISelectMenuComponent & { [$actionRowChild]: true })
  )[];
}

export function Message(
  props: MessageProps
): WithFileAttachments<APIInteractionResponseCallbackData> & {
  [$update]?: boolean;
} {
  // Sort children into correct slots
  let content = undefined;
  const embeds: APIEmbed[] = [];
  const components: APIActionRowComponent[] = [];
  for (const child of props.children?.flat(Infinity) ?? []) {
    if (isEmptyChild(child)) continue;
    if ((child as any)[$embed]) {
      embeds.push(child as any);
    } else if ((child as any)[$actionRow]) {
      components.push(child as any);
    } else if ((child as any)[$actionRowChild]) {
      // Implicitly add buttons/select menus to their own action rows
      components.push({
        type: ComponentType.ACTION_ROW,
        components: [child as any],
      });
    } else {
      content ??= "";
      content += child;
    }
  }

  // Construct message response
  return {
    [$update]: props.update,
    content,
    embeds,
    components,
    attachments: props.attachments,
    tts: props.tts,
    flags: props.ephemeral ? 64 : undefined,
    allowed_mentions: props.allowedMentions && {
      parse: props.allowedMentions.parse as any,
      roles: props.allowedMentions.roles,
      users: props.allowedMentions.users,
      replied_user: props.allowedMentions.repliedUser,
    },
  };
}
