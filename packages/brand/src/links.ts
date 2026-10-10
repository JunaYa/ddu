/** Product owners supply their own social links and contact addresses. */
export interface SocialEntry {
  handle?: string;
  name: string;
  url: string;
}

export const SOCIALS: Record<string, SocialEntry> = {};
export const CONTACTS: Record<string, string> = {};
