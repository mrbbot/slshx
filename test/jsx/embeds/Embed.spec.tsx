import test from "ava";
import type {
  APIEmbed,
  APIEmbedAuthor,
  APIEmbedFooter,
  APIEmbedProvider,
} from "discord-api-types/v9";
import { $embed, $field, Embed, Field, createElement } from "../../../src";
import { emptyEmbed } from "../helpers";

test("creates embed", (t) => {
  let embed: APIEmbed = <Embed />;
  t.deepEqual(embed, { ...emptyEmbed, [$embed]: true });

  embed = (
    <Embed title="Title" url="https://miniflare.dev" color={0x0094ff}>
      Description
      {true}
      {false}
      {null}
      {undefined}
      {[" more", [" of", [" the", [" description!"]]]]}
    </Embed>
  );
  t.deepEqual(embed, {
    ...emptyEmbed,
    [$embed]: true,
    title: "Title",
    description: "Description more of the description!",
    url: "https://miniflare.dev",
    color: 0x0094ff,
  });

  // Check empty string passed through to description
  embed = <Embed />;
  t.is(embed.description, undefined);
  embed = <Embed>{""}</Embed>;
  t.is(embed.description, "");
});

test("creates embed with timestamp", (t) => {
  let embed: APIEmbed = <Embed timestamp="2021-12-24T19:18:00.766Z" />;
  t.is(embed.timestamp, "2021-12-24T19:18:00.766Z");

  const date = new Date();
  embed = <Embed timestamp={date} />;
  t.is(embed.timestamp, date.toISOString());
});

test("creates embed with image, thumbnail or video", (t) => {
  let embed: APIEmbed = (
    <Embed
      image="https://miniflare.dev/image"
      thumbnail="https://miniflare.dev/thumbnail"
      video="https://miniflare.dev/video"
    />
  );
  const image = { url: "https://miniflare.dev/image" };
  const thumbnail = { url: "https://miniflare.dev/thumbnail" };
  const video = { url: "https://miniflare.dev/video" };
  t.deepEqual(embed, {
    ...emptyEmbed,
    [$embed]: true,
    image,
    thumbnail,
    video,
  });

  embed = <Embed image={image} thumbnail={thumbnail} video={video} />;
  t.like(embed.image, image);
  t.like(embed.thumbnail, thumbnail);
  t.like(embed.video, video);
});

test("creates embed with footer, provider or author", (t) => {
  let embed: APIEmbed = (
    <Embed footer="Footer" provider="Provider" author="Author" />
  );
  const footer: APIEmbedFooter = { text: "Footer" };
  const provider: APIEmbedProvider = { name: "Provider" };
  const author: APIEmbedAuthor = { name: "Author" };
  t.deepEqual(embed, {
    ...emptyEmbed,
    [$embed]: true,
    footer,
    provider,
    author,
  });

  embed = <Embed footer={footer} provider={provider} author={author} />;
  t.is(embed.footer, footer);
  t.is(embed.provider, provider);
  t.is(embed.author, author);
});

test("creates embed with fields", (t) => {
  let embed: APIEmbed = (
    <Embed>
      Description
      <Field name="field1">v{["1", ["f", [1]]]}</Field>
      <Field name="field2">v{["2", ["f", [2]]]}</Field>
      <Field name="field3" inline>
        v{["3", ["f", [3]]]}
      </Field>{" "}
      More description!
    </Embed>
  );
  t.deepEqual(embed, {
    ...emptyEmbed,
    [$embed]: true,
    description: "Description More description!",
    fields: [
      {
        [$field]: true,
        name: "field1",
        value: "v1f1",
        inline: undefined,
      },
      {
        [$field]: true,
        name: "field2",
        value: "v2f2",
        inline: undefined,
      },
      {
        [$field]: true,
        name: "field3",
        value: "v3f3",
        inline: true,
      },
    ],
  });

  embed = (
    <Embed>
      <Field name="name">value</Field>
    </Embed>
  );
  t.is(embed.description, undefined);
});
