import type { APITextInputComponent } from "discord-api-types/v9";
import { ComponentType, TextInputStyle } from "../../api";
import { $actionRowChild } from "./Row";

export interface InputProps {
  id: string;
  label: string;
  placeholder?: string;
  value?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  paragraph?: boolean;
}

export function Input(
  props: InputProps
): APITextInputComponent & { [$actionRowChild]: true } {
  return {
    [$actionRowChild]: true,
    type: ComponentType.TEXT_INPUT,
    style: props.paragraph ? TextInputStyle.PARAGRAPH : TextInputStyle.SHORT,
    custom_id: props.id,
    label: props.label,
    placeholder: props.placeholder,
    value: props.value,
    min_length: props.minLength,
    max_length: props.maxLength,
    required: props.required,
  };
}
