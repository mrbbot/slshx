// https://github.com/microsoft/TypeScript/pull/22207 ?
export function createElement<Attributes, Children extends any[], Return>(
  component: (props: Attributes & { children: Children }) => Return,
  attributes: Attributes,
  ...children: Children
): Return {
  return component({ ...attributes, children });
}

export function Fragment<Children extends any[]>({
  children,
}: {
  children: Children;
}): Children {
  return children;
}

export type { Child } from "./helpers";
export * from "./components";
export * from "./embeds";
export * from "./Message";
export * from "./Modal";
