import { PAGES } from "@/app/_utils/routes.utils";

import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata = PAGES.static.authMotDePasseOublie.getMetadata();

export default function Page() {
  return <ForgotPasswordClient />;
}
