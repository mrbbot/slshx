import type {
  APIMessageComponentEmoji,
  APISelectMenuOption,
} from "discord-api-types/v9";
import { Child, childrenContent } from "../helpers";

export interface OptionProps {
  value: string;
  description?: string;
  emoji?: string | APIMessageComponentEmoji;
  default?: boolean;
  children?: Child[];
}

export function Option(props: OptionProps): APISelectMenuOption {
  return {
    value: props.value,
    description: props.description,
    emoji:
      typeof props.emoji === "string" ? { name: props.emoji } : props.emoji,
    default: props.default,
    label: childrenContent(props.children) ?? props.value,
  };
}
