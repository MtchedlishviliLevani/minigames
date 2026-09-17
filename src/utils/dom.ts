interface ElementProps {
  className?: string;
  text?: string;
  attrs?: Record<string, string>;
  children?: (Node | string)[];
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElementProps = {}
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.text !== undefined) node.textContent = props.text;
  if (props.attrs) {
    for (const [key, value] of Object.entries(props.attrs)) {
      node.setAttribute(key, value);
    }
  }
  if (props.children) node.append(...props.children);
  return node;
}
