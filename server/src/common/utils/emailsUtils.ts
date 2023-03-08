import mjml from "mjml";
import { promisify } from "util";
import ejs from "ejs";
import config from "../../config.js";

const renderFile = promisify(ejs.renderFile);

export function getPublicUrl(path) {
  return `${config.publicUrl}${path}`;
}

export async function generateHtml(to, template) {
  const { subject, templateFile, data } = template;
  const buffer = await renderFile(templateFile, {
    to,
    subject,
    data,
    utils: { getPublicUrl },
  });
  const { html } = mjml(buffer.toString(), { minify: true });
  return html;
}
