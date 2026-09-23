declare module "mjml" {
  interface MjmlOptions {
    minify?: boolean;
    beautify?: boolean;
    keepComments?: boolean;
    validationLevel?: "strict" | "soft" | "skip";
  }

  interface MjmlError {
    line: number;
    message: string;
    tagName: string;
    formattedMessage: string;
  }

  export default function mjml2html(mjml: string, options?: MjmlOptions): { html: string; errors: MjmlError[] };
}
