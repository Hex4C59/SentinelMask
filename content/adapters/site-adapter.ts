import {
  findEditableWithin,
  isEditableElement,
  type EditableElement
} from "../../core/text/input-accessor";

export interface SiteAdapter {
  site: string;
  isSendButton(element: HTMLElement): boolean;
  resolveEditable?(element: HTMLElement): EditableElement | null;
}

const maxTriggerScopeDepth = 6;

function hasToken(target: string, tokens: string[]): boolean {
  const lower = target.toLowerCase();
  return tokens.some((token) => lower.includes(token));
}

export function defaultIsSendButton(element: HTMLElement): boolean {
  const label = [
    element.getAttribute("aria-label"),
    element.getAttribute("data-testid"),
    element.getAttribute("name"),
    element.textContent
  ]
    .filter(Boolean)
    .join(" ");

  if (hasToken(label, ["send", "发送", "submit"])) {
    return true;
  }

  if (element instanceof HTMLButtonElement && element.type === "submit") {
    return true;
  }

  return false;
}

export function findEditableNearTrigger(element: HTMLElement): EditableElement | null {
  let scope: HTMLElement | null = element.parentElement;
  let depth = 0;

  while (scope && depth < maxTriggerScopeDepth) {
    const candidate = findEditableWithin(scope);
    if (candidate) {
      return candidate;
    }
    scope = scope.parentElement;
    depth += 1;
  }

  const active = document.activeElement;
  return isEditableElement(active) ? active : null;
}
