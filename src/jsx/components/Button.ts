import type {
  APIButtonComponent,
  APIMessageComponentEmoji,
} from "discord-api-types/v9";
import { ButtonStyle, ComponentType } from "../../api";
import { Child, childrenContent } from "../helpers";
import { $actionRowChild } from "./Row";

export interface ButtonPropsBase {
  emoji?: string | APIMessageComponentEmoji;
  disabled?: boolean;
  primary?: boolean;
  success?: boolean;
  danger?: boolean;
  children?: Child[];
}

export interface ButtonPropsWithID extends ButtonPropsBase {
  id: string;
}

export interface ButtonPropsWithURL extends ButtonPropsBase {
  url: string;
}

export type ButtonProps = ButtonPropsWithID | ButtonPropsWithURL;

export function Button(
  props: ButtonProps
): APIButtonComponent & { [$actionRowChild]: true } {
  return {
    [$actionRowChild]: true,
    type: ComponentType.BUTTON,
    ...("url" in props ? { url: props.url } : { custom_id: props.id }),
    emoji:
      typeof props.emoji === "string" ? { name: props.emoji } : props.emoji,
    disabled: props.disabled,
    label: childrenContent(props.children),
    style:
      "url" in props
        ? ButtonStyle.LINK
        : props.primary
        ? ButtonStyle.PRIMARY
        : props.success
        ? ButtonStyle.SUCCESS
        : props.danger
        ? ButtonStyle.DANGER
        : ButtonStyle.SECONDARY,
  };
}
