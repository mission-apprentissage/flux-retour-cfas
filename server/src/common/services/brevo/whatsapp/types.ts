export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
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
