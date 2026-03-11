import { defaultIsSendButton, findEditableNearTrigger, type SiteAdapter } from "./site-adapter";

const selectors = [
  "#send-button",
  'button[data-testid="send-button"]',
  'button[data-testid="deepseek-send-button"]',
  'button[aria-label*="发送"]',
  'button[aria-label*="Send"]'
];

export const deepSeekAdapter: SiteAdapter = {
  site: "chat.deepseek.com",
  isSendButton(element) {
    return selectors.some((selector) => element.matches(selector)) || defaultIsSendButton(element);
  },
  resolveEditable(element) {
    return findEditableNearTrigger(element);
  }
};
