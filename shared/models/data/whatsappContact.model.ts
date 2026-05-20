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
  PREQUALIF_YES: "prequalif_yes",
  PREQUALIF_NO: "prequalif_no",
} as const;

export const zUserResponseType = z.enum(["callback", "no_help", "prequalif_yes", "prequalif_no"]);
export type IUserResponseType = z.infer<typeof zUserResponseType>;

export const CONVERSATION_STATE = {
  INITIAL_SENT: "initial_sent",
  USER_RESPONDED: "user_responded",
  CALLBACK_REQUESTED: "callback_requested",
  CLOSED: "closed",
} as const;

export const zConversationState = z.enum(["initial_sent", "user_responded", "callback_requested", "closed"]);
export type IConversationState = z.infer<typeof zConversationState>;

export const zWhatsAppTemplateType = z.enum(["injoignables", "prequalif"]);
export type IWhatsAppTemplateType = z.infer<typeof zWhatsAppTemplateType>;

export const zWhatsAppSentVia = z.enum(["backfill", "daily"]);
export type IWhatsAppSentVia = z.infer<typeof zWhatsAppSentVia>;

export const zWhatsAppMessageHistory = z.object({
  direction: z.enum(["outbound", "inbound"]),
  content: z.string(),
  sent_at: z.date(),
  brevo_message_id: z.string().nullish(),
});

export type IWhatsAppMessageHistory = z.infer<typeof zWhatsAppMessageHistory>;

export const zWhatsAppRdvClick = z.object({
  clicked_at: z.date(),
  redirect_url: z.string().nullable().describe("URL cible au moment du clic (snapshot), null si fallback"),
});

export type IWhatsAppRdvClick = z.infer<typeof zWhatsAppRdvClick>;

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
  auto_reply_sent: z.boolean().default(false),
  auto_reply_sent_at: z.date().nullish(),
  messages_history: z.array(zWhatsAppMessageHistory).nullish(),
  template_type: zWhatsAppTemplateType
    .nullish()
    .describe("Template Brevo utilisé pour le premier envoi (route les réponses entrantes)"),
  sent_via: zWhatsAppSentVia
    .nullish()
    .describe(
      "Mode d'envoi du message initial. Conditionne l'envoi de la notif individuelle ML au moment du YES : uniquement si 'daily' (cron quotidien régime stable), jamais si 'backfill'"
    ),
  prequalif_notif_sent_at: z
    .date()
    .nullish()
    .describe(
      "Horodatage de l'envoi de la notif individuelle ML (sent_via='daily' only). Garantit l'idempotence en cas de replay webhook YES."
    ),
  rdv_redirect_token: z
    .string()
    .uuid()
    .nullish()
    .describe(
      "UUID v4 généré au moment de l'envoi du template suivi-yes-with-url, utilisé pour la redirection /r/:token"
    ),
  rdv_redirect_token_created_at: z.date().nullish(),
  rdv_clicks: z.array(zWhatsAppRdvClick).default([]).describe("Historique des clics sur le lien /r/:token (embedded)."),
});

export type IWhatsAppContact = z.infer<typeof zWhatsAppContact>;
