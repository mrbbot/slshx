import type {
  APISelectMenuComponent,
  APISelectMenuOption,
} from "discord-api-types/v10";
import { ComponentType } from "../../api";
import { $actionRowChild } from "./Row";

export interface SelectProps {
  id: string;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  children?: APISelectMenuOption[];
}

export function Select(
  props: SelectProps
): APISelectMenuComponent & { [$actionRowChild]: true } {
  return {
    [$actionRowChild]: true,
    type: ComponentType.SELECT_MENU,
    custom_id: props.id,
    placeholder: props.placeholder,
    min_values: props.min,
    max_values: props.max,
    disabled: props.disabled,
    options: props.children?.flat(Infinity) ?? [],
  };
}
