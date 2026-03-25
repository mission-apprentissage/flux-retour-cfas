import shared from "./CollaborationDetail.shared.module.css";

export function withSharedStyles<T extends Record<string, string>>(local: T): T & typeof shared {
  return { ...shared, ...local };
}
