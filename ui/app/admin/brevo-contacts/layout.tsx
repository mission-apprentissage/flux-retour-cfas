import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Listes de contacts Brevo | Tableau de bord de l'apprentissage",
};

export default function BrevoContactListsLayout({ children }: { children: JSX.Element }) {
  return children;
}
