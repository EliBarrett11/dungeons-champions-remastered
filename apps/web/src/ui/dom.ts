/** Tiny element builder. Text is always set through text nodes, never parsed as HTML. */
type Child = Node | string | number | null | undefined | false;

export interface Attrs {
  readonly class?: string;
  readonly id?: string;
  readonly title?: string;
  readonly disabled?: boolean;
  readonly type?: string;
  readonly role?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-live'?: string;
  readonly 'aria-pressed'?: string;
  readonly 'data-testid'?: string;
  readonly style?: string;
  readonly onClick?: (event: Event) => void;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: readonly (Child | readonly Child[])[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key === 'onClick') {
      element.addEventListener('click', value as EventListener);
    } else if (key === 'disabled') {
      (element as HTMLButtonElement).disabled = Boolean(value);
    } else if (key === 'class') {
      element.className = String(value);
    } else {
      element.setAttribute(key, String(value));
    }
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
}

export function button(label: string, onClick: () => void, attrs: Attrs = {}): HTMLButtonElement {
  return h('button', { type: 'button', ...attrs, onClick: () => onClick() }, label);
}
