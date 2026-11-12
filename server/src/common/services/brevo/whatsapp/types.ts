export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: number;
  /** Un nouvel essai a une chance de réussir (pas de réponse, 5xx, 408, 429). */
  retryable?: boolean;
  /** La requête n'a sûrement pas été traitée : la rejouer ne peut pas doubler le message. */
  safeToRetry?: boolean;
}

export interface MissionLocaleInfo {
  nom: string;
  telephone?: string;
  site_web?: string;
  adresse?: string;
}

export interface MissionLocaleInfoFull extends MissionLocaleInfo {
  email?: string;
  adresse_inline?: string;
  rdv_url?: string;
}

export interface WhatsAppTemplateParams {
  templateId: number;
  params?: Record<string, string>;
}
