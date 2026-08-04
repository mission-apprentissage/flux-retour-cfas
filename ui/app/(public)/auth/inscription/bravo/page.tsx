import { PAGES } from "@/app/_utils/routes.utils";

import { AuthMessageCard } from "../../_components/AuthMessageCard";

export const metadata = PAGES.static.authInscriptionBravo.getMetadata();

export default function InscriptionBravoPage() {
  return (
    <main>
      <AuthMessageCard icon="ri-mail-send-line" tone="success" title="Vérifiez votre boite mail !">
        <p>Vous allez recevoir un email de confirmation vous permettant de valider votre compte.</p>
        <p>N’oubliez pas de vérifier vos courriers indésirables.</p>
      </AuthMessageCard>
    </main>
  );
}
