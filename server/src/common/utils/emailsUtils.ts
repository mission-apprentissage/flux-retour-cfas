import { promisify } from "util";

import ejs from "ejs";
import mjml from "mjml";

import config from "@/config";

const renderFile = promisify(ejs.renderFile);

export function getPublicUrl(path) {
  return `${config.publicUrl}${path}`;
}

export async function generateHtml(to: string, { subject, templateFile, data }) {
  const buffer = await renderFile(templateFile, {
    to,
    subject,
    data,
    utils: { getPublicUrl },
  });
  const { html } = mjml(buffer.toString(), { minify: true });
  return html;
}
