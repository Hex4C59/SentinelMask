import { defaultIsSendButton, type SiteAdapter } from "./site-adapter";

const selectors = [
  'button[data-testid="send-button"]',
  'button[aria-label*="Send"]',
  'button[aria-label*="发送"]'
];

export const chatGptAdapter: SiteAdapter = {
  site: "chatgpt.com",
  isSendButton(element) {
    return selectors.some((selector) => element.matches(selector)) || defaultIsSendButton(element);
  }
};
