import { z } from "zod";

export const MESSAGE_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
} as const;

export const zMessageStatus = z.enum(["pending", "sent", "delivered", "read", "failed"]);
export type IMessageStatus = z.infer<typeof zMessageStatus>;

export const USER_RESPONSE_TYPE = {
  CALLBACK: "callback",
  NO_HELP: "no_help",
} as const;

export const zUserResponseType = z.enum(["callback", "no_help"]);
export type IUserResponseType = z.infer<typeof zUserResponseType>;

export const CONVERSATION_STATE = {
  INITIAL_SENT: "initial_sent",
  CALLBACK_REQUESTED: "callback_requested",
  CLOSED: "closed",
} as const;

export const zConversationState = z.enum(["initial_sent", "callback_requested", "closed"]);
export type IConversationState = z.infer<typeof zConversationState>;

export const zWhatsAppMessageHistory = z.object({
  direction: z.enum(["outbound", "inbound"]),
  content: z.string(),
  sent_at: z.date(),
  brevo_message_id: z.string().nullish(),
});

export type IWhatsAppMessageHistory = z.infer<typeof zWhatsAppMessageHistory>;

export const zWhatsAppContact = z.object({
  phone_normalized: z.string(),
  last_message_sent_at: z.date().nullish(),
  message_id: z.string().nullish().describe("ID du message Brevo"),
  message_status: zMessageStatus.nullish(),
  status_updated_at: z.date().nullish(),
  brevo_visitor_id: z.string().nullish(),
  conversation_state: zConversationState.nullish(),
  user_response: zUserResponseType.nullish(),
  user_response_at: z.date().nullish(),
  user_response_raw: z.string().nullish().describe("Texte brut de la réponse utilisateur"),
  opted_out: z.boolean().default(false),
  opted_out_at: z.date().nullish(),
  messages_history: z.array(zWhatsAppMessageHistory).nullish(),
});

export type IWhatsAppContact = z.infer<typeof zWhatsAppContact>;
