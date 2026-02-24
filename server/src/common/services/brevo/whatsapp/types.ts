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

export interface WhatsAppTemplateParams {
  templateId: number;
  params?: Record<string, string>;
}
