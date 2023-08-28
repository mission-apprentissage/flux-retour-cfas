import ejs from "ejs";
import mjml from "mjml";

import config from "@/config";

export function getPublicUrl(path: string) {
  return `${config.publicUrl}${path}`;
}

export async function generateHtml(
  to: string,
  { subject, templateFile, data }: { subject: string; templateFile: string; data: unknown }
) {
  const buffer = await ejs.renderFile(templateFile, {
    to,
    subject,
    data,
    utils: { getPublicUrl },
  });

  const { html } = mjml(buffer.toString(), { minify: true });
  return html;
}
