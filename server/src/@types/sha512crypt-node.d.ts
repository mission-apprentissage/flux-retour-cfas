declare module "sha512crypt-node" {
  export function sha512crypt(password: string, salt: string): string;
}
