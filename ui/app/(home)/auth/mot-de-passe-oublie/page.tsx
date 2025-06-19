import { Metadata } from "next";

import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Mot de passe oublié | Tableau de bord de l'apprentissage",
};

export default function Page() {
  return <ForgotPasswordClient />;
}
