import type {
  APIActionRowComponent,
  APIModalActionRowComponent,
  APITextInputComponent,
} from "discord-api-types/v10";
import { ComponentType } from "../api";
import { $modal, ModalResponse } from "../commands";
import { $actionRow, $actionRowChild } from "./components";
import { isEmptyChild } from "./helpers";

export interface ModalProps {
  id: string;
  title: string;
  children?: (
    | (APIActionRowComponent<APIModalActionRowComponent> & { [$actionRow]: true })
    | (APITextInputComponent & { [$actionRowChild]: true })
  )[];
}

export function Modal(props: ModalProps): ModalResponse {
  const components: APIActionRowComponent<APIModalActionRowComponent>[] = [];
  for (const child of props.children?.flat(Infinity) ?? []) {
    if (isEmptyChild(child)) continue;
    if ((child as any)[$actionRow]) {
      components.push(child as any);
    } else if ((child as any)[$actionRowChild]) {
      // Implicitly add inputs to their own action rows
      components.push({
        type: ComponentType.ACTION_ROW,
        components: [child as any],
      });
    }
  }

  // Construct modal response
  return {
    [$modal]: true,
    custom_id: props.id,
    title: props.title,
    components,
  };
}
