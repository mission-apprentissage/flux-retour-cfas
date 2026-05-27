export const WHATSAPP_EVENT_COPY = {
  WHATSAPP_PREQUALIF_YES: {
    title: "Le jeune souhaite un rendez-vous",
    subtext: "Demande reçue par message",
    tooltip:
      "L'équipe du service a contacté ce jeune par message. Le jeune a indiqué qu'il souhaitait être recontacté par la Mission Locale.",
  },
  WHATSAPP_PREQUALIF_NO: {
    title: "Le jeune ne souhaite pas être contacté",
    subtext: "Demande reçue par message",
    tooltip:
      "L'équipe du service a contacté ce jeune par message. Le jeune a indiqué qu'il ne souhaitait pas être recontacté.",
  },
  WHATSAPP_YES_HELP: {
    title: "Le jeune a indiqué vouloir être recontacté par la Mission locale",
    subtext: "Réponse reçue par message",
    tooltip:
      "L'équipe du service a contacté ce jeune par message. Le jeune a indiqué qu'il souhaitait être recontacté par la Mission Locale.",
  },
  WHATSAPP_NO_HELP: {
    title: "Le jeune a indiqué ne pas vouloir être recontacté par la Mission locale",
    subtext: "Réponse reçue par message",
    tooltip:
      "L'équipe du service a contacté ce jeune par message. Le jeune a indiqué qu'il ne souhaitait pas être recontacté.",
  },
} as const;

export type WhatsAppEventKey = keyof typeof WHATSAPP_EVENT_COPY;

export const WHATSAPP_EVENT_ICON: Record<WhatsAppEventKey, "whatsapp-yes" | "whatsapp-no"> = {
  WHATSAPP_PREQUALIF_YES: "whatsapp-yes",
  WHATSAPP_PREQUALIF_NO: "whatsapp-no",
  WHATSAPP_YES_HELP: "whatsapp-yes",
  WHATSAPP_NO_HELP: "whatsapp-no",
};
