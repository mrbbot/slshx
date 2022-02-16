import test from "ava";
import type { APIModalInteractionResponseCallbackData } from "discord-api-types/v9";
import {
  $actionRow,
  $actionRowChild,
  $modal,
  ComponentType,
  Input,
  Modal,
  Row,
  TextInputStyle,
  createElement,
} from "../../src";

test("creates modal", (t) => {
  let modal: APIModalInteractionResponseCallbackData = (
    <Modal id="modal_id" title="Title">
      {/* testing implicit ACTION_ROW creation */}
      <Input
        id="short_id"
        label="Short"
        placeholder="Short Place"
        minLength={1}
        maxLength={10}
        required
      />
      <Row>
        <Input id="long_id" label="Long" paragraph />
      </Row>
    </Modal>
  );
  t.deepEqual(modal, {
    [$modal]: true,
    custom_id: "modal_id",
    title: "Title",
    components: [
      {
        type: ComponentType.ACTION_ROW,
        components: [
          {
            [$actionRowChild]: true,
            type: ComponentType.TEXT_INPUT,
            style: TextInputStyle.SHORT,
            custom_id: "short_id",
            label: "Short",
            placeholder: "Short Place",
            value: undefined,
            min_length: 1,
            max_length: 10,
            required: true,
          },
        ],
      },
      {
        [$actionRow]: true,
        type: ComponentType.ACTION_ROW,
        components: [
          {
            [$actionRowChild]: true,
            type: ComponentType.TEXT_INPUT,
            style: TextInputStyle.PARAGRAPH,
            custom_id: "long_id",
            label: "Long",
            placeholder: undefined,
            value: undefined,
            min_length: undefined,
            max_length: undefined,
            required: undefined,
          },
        ],
      },
    ],
  });
});
