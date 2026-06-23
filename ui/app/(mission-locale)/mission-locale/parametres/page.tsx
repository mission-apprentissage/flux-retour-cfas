import { redirect } from "next/navigation";

import { COMPTE_SETTINGS_HREF } from "@/common/utils/compteSettings";

// Les paramètres de la Mission Locale sont regroupés dans le hub unifié /compte.
// Redirection côté serveur (307, sans flash).
export default function ParametresRedirectPage() {
  redirect(COMPTE_SETTINGS_HREF);
}
