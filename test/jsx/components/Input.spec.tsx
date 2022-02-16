import test from "ava";
import type { APITextInputComponent } from "discord-api-types/v9";
import {
  $actionRowChild,
  ComponentType,
  Input,
  TextInputStyle,
  createElement,
} from "../../../src";

test("creates input component", (t) => {
  let input: APITextInputComponent = (
    <Input
      id="custom_id"
      label="Label"
      placeholder="Placeholder"
      value="Value"
      minLength={1}
      maxLength={100}
      required
    />
  );
  t.deepEqual(input, {
    [$actionRowChild]: true,
    type: ComponentType.TEXT_INPUT,
    style: TextInputStyle.SHORT,
    custom_id: "custom_id",
    label: "Label",
    placeholder: "Placeholder",
    value: "Value",
    min_length: 1,
    max_length: 100,
    required: true,
  });

  input = <Input id="id" label="Paragraph" paragraph />;
  t.is(input.style, TextInputStyle.PARAGRAPH);
});
