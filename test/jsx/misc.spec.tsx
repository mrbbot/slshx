import test from "ava";
import type {
  APIActionRowComponent,
  APIActionRowComponentTypes,
  APIButtonComponent,
} from "discord-api-types/v9";
// noinspection ES6UnusedImports
import {
  $actionRow,
  $actionRowChild,
  Button,
  ButtonStyle,
  ComponentType,
  Fragment,
  Message,
  Row,
  createElement,
} from "../../src";
import { Child, childrenContent } from "../../src/jsx/helpers";
import { APIMessage, emptyMessage } from "./helpers";

test("childrenContent: flattens and removes empty children", (t) => {
  t.is(childrenContent(), undefined);
  t.is(childrenContent([]), undefined);
  t.is(childrenContent([""]), "");
  t.is(childrenContent(["a", true, false, null, undefined, 1]), "a1");
  t.is(
    childrenContent(["a", [1, ["b", [2, true]]], ["c"], 0] as any),
    "a1b2c0"
  );
});

test("can define reusable components", (t) => {
  interface PrimaryButtonProps {
    id: string;
    children?: Child[];
  }

  function PrimaryButton({ id, children }: PrimaryButtonProps) {
    return (
      <Button id={id} primary>
        {children}
      </Button>
    );
  }

  interface TestMessageProps {
    a: number;
    b: number;
  }

  function TestMessage({ a, b }: TestMessageProps) {
    return (
      <Message>
        {a} + {b} = {a + b}
        <PrimaryButton id="custom_id">Label</PrimaryButton>
      </Message>
    );
  }

  const msg: APIMessage = <TestMessage a={1} b={2} />;
  t.deepEqual(msg, {
    ...emptyMessage,
    content: "1 + 2 = 3",
    components: [
      {
        type: ComponentType.ACTION_ROW,
        components: [
          {
            [$actionRowChild]: true,
            type: ComponentType.BUTTON,
            custom_id: "custom_id",
            disabled: undefined,
            emoji: undefined,
            label: "Label",
            style: ButtonStyle.PRIMARY,
          },
        ],
      },
    ],
  });
});

test("can use fragments in components", (t) => {
  interface ConfirmButtonsProps {
    yesId: string;
    noId: string;
  }

  function ConfirmButtons({ yesId, noId }: ConfirmButtonsProps) {
    return (
      <>
        <Button id={yesId} success>
          Yes
        </Button>
        <Button id={noId} danger>
          No
        </Button>
      </>
    );
  }

  const buttons: APIButtonComponent[] = (
    <ConfirmButtons yesId="yes_custom_id" noId="no_custom_id" />
  );
  const expectedButtons = [
    {
      [$actionRowChild]: true,
      type: ComponentType.BUTTON,
      custom_id: "yes_custom_id",
      emoji: undefined,
      disabled: undefined,
      label: "Yes",
      style: ButtonStyle.SUCCESS,
    },
    {
      [$actionRowChild]: true,
      type: 2,
      custom_id: "no_custom_id",
      emoji: undefined,
      disabled: undefined,
      label: "No",
      style: ButtonStyle.DANGER,
    },
  ];
  t.deepEqual(buttons, expectedButtons);

  const row: APIActionRowComponent<APIActionRowComponentTypes> = (
    <Row>
      <ConfirmButtons yesId="yes_custom_id" noId="no_custom_id" />
    </Row>
  );
  t.deepEqual(row, {
    [$actionRow]: true,
    type: ComponentType.ACTION_ROW,
    components: expectedButtons,
  });
});
