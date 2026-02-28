import { chatGptAdapter } from "./chatgpt-adapter";
import { defaultIsSendButton, type SiteAdapter } from "./site-adapter";

const genericAdapter: SiteAdapter = {
  site: "generic",
  isSendButton: defaultIsSendButton
};

export function resolveSiteAdapter(hostname: string): SiteAdapter {
  if (hostname === "chatgpt.com" || hostname === "chat.openai.com") {
    return chatGptAdapter;
  }
  return genericAdapter;
}
