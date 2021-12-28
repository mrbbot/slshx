export type Child = string | number | boolean | null | undefined;

export function isEmptyChild(child: any): boolean {
  return (!child && child !== 0 && child !== "") || child === true;
}

export function childrenContent(children?: Child[]): string | undefined {
  let content = undefined;
  for (const child of children?.flat(Infinity) ?? []) {
    if (isEmptyChild(child)) continue;
    content ??= "";
    content += child;
  }
  return content;
}
