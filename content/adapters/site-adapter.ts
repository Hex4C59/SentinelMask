export interface SiteAdapter {
  site: string;
  isSendButton(element: HTMLElement): boolean;
}

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
