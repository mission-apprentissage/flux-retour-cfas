import { tbaContactsContactList } from "./tba-contacts.contact-list";
import { ContactListDefinition } from "./types";

export const contactListRegistry: Record<string, ContactListDefinition> = {
  [tbaContactsContactList.slug]: tbaContactsContactList,
};

export const getContactList = (slug: string): ContactListDefinition => {
  const list = contactListRegistry[slug];
  if (!list) {
    throw new Error(`Unknown contact list: ${slug}`);
  }
  return list;
};

export const listContactLists = (): ContactListDefinition[] => Object.values(contactListRegistry);
