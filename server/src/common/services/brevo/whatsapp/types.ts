export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface MissionLocaleInfo {
  nom: string;
  telephone?: string;
  email?: string;
}

export interface WhatsAppTemplateParams {
  templateId: number;
  params?: Record<string, string>;
}
