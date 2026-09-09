declare module "nodemailer-html-to-text" {
  import type Mail from "nodemailer/lib/mailer";

  interface HtmlToTextOptions {
    ignoreImage?: boolean;
    ignoreHref?: boolean;
    wordwrap?: number | false;
  }

  export function htmlToText(options?: HtmlToTextOptions): Mail.PluginFunction;
}
