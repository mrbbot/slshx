import test from "ava";
import { File } from "undici";
import {
  $actionRow,
  $actionRowChild,
  $embed,
  $field,
  $update,
  AllowedMentionsProps,
  AllowedMentionsTypes,
  Button,
  ButtonStyle,
  ComponentType,
  Embed,
  Field,
  Message,
  Option,
  Row,
  Select,
  createElement,
} from "../../src";
import { APIMessage, emptyEmbed, emptyMessage } from "./helpers";

test("creates message", (t) => {
  let msg: APIMessage = <Message />;
  t.deepEqual(msg, emptyMessage);

  const allowedMentions: AllowedMentionsProps = {
    parse: [AllowedMentionsTypes.EVERYONE],
    users: ["snowflake-ish"],
    repliedUser: true,
  };
  msg = (
    <Message update tts ephemeral allowedMentions={allowedMentions}>
      Content
      {true}
      {false}
      {null}
      {undefined}
      {[" more", [" of", [" the", [" content!"]]]]}
    </Message>
  );
  t.deepEqual(msg, {
    ...emptyMessage,
    [$update]: true,
    content: "Content more of the content!",
    tts: true,
    flags: 64, // EPHEMERAL
    allowed_mentions: {
      parse: [AllowedMentionsTypes.EVERYONE] as any,
      users: ["snowflake-ish"],
      roles: undefined,
      replied_user: true,
    },
  });

  // Check empty string passed through to content (important for clearing
  // message content in update)
  msg = <Message />;
  t.is(msg.content, undefined);
  msg = <Message>{""}</Message>;
  t.is(msg.content, "");
});

test("creates message with embeds", (t) => {
  let msg: APIMessage = (
    <Message>
      Content
      <Embed title="Title 1">
        Description
        <Field name="Name">Value</Field>
      </Embed>
      <Embed image="https://miniflare.dev/image" /> ...and more content!
    </Message>
  );
  t.deepEqual(msg, {
    ...emptyMessage,
    content: "Content ...and more content!",
    embeds: [
      {
        ...emptyEmbed,
        [$embed]: true,
        title: "Title 1",
        description: "Description",
        fields: [
          { [$field]: true, name: "Name", value: "Value", inline: undefined },
        ],
      },
      {
        ...emptyEmbed,
        [$embed]: true,
        image: { url: "https://miniflare.dev/image" },
      },
    ],
  });
});

test("creates message with components", (t) => {
  const msg: APIMessage = (
    <Message>
      <Row>
        <Button id="id1" primary>
          Primary
        </Button>
        <Button id="id2">Secondary</Button>
      </Row>
      <Row>
        <Select id="id3">
          <Option value="1">O1</Option>
          <Option value="2">O2</Option>
        </Select>
      </Row>
    </Message>
  );
  const u = undefined;
  t.deepEqual(msg, {
    ...emptyMessage,
    components: [
      {
        [$actionRow]: true,
        type: ComponentType.ACTION_ROW,
        components: [
          {
            [$actionRowChild]: true,
            type: ComponentType.BUTTON,
            custom_id: "id1",
            label: "Primary",
            style: ButtonStyle.PRIMARY,
            disabled: undefined,
            emoji: undefined,
          },
          {
            [$actionRowChild]: true,
            type: ComponentType.BUTTON,
            custom_id: "id2",
            label: "Secondary",
            style: ButtonStyle.SECONDARY,
            disabled: undefined,
            emoji: undefined,
          },
        ],
      },
      {
        [$actionRow]: true,
        type: ComponentType.ACTION_ROW,
        components: [
          {
            [$actionRowChild]: true,
            type: ComponentType.SELECT_MENU,
            custom_id: "id3",
            disabled: undefined,
            min_values: undefined,
            max_values: undefined,
            placeholder: undefined,
            options: [
              { value: "1", label: "O1", default: u, description: u, emoji: u },
              { value: "2", label: "O2", default: u, description: u, emoji: u },
            ],
          },
        ],
      },
    ],
  });
});

test("implicitly creates action rows for lone components", (t) => {
  const msg: APIMessage = (
    <Message>
      <Button id="id1" />
      <Select id="id2" />
    </Message>
  );
  t.deepEqual(msg, {
    ...emptyMessage,
    components: [
      {
        type: ComponentType.ACTION_ROW,
        components: [
          {
            [$actionRowChild]: true,
            type: ComponentType.BUTTON,
            custom_id: "id1",
            label: undefined,
            style: ButtonStyle.SECONDARY,
            disabled: undefined,
            emoji: undefined,
          },
        ],
      },
      {
        type: ComponentType.ACTION_ROW,
        components: [
          {
            [$actionRowChild]: true,
            type: ComponentType.SELECT_MENU,
            custom_id: "id2",
            disabled: undefined,
            min_values: undefined,
            max_values: undefined,
            placeholder: undefined,
            options: [],
          },
        ],
      },
    ],
  });
});

test("creates message with attachments", (t) => {
  const attachments: File[] = [
    new File(["1"], "file1.txt", { type: "text/plain" }),
    new File(["<p>2</p>"], "file2.html", { type: "text/html" }),
  ];
  const msg: APIMessage = <Message attachments={attachments} />;
  t.deepEqual(msg, {
    ...emptyMessage,
    attachments,
  });
});
