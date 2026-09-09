import { notFound } from "next/navigation";

import { PAGES } from "@/app/_utils/routes.utils";
import { categoriesCompteInscription, type CategorieCompteInscription } from "@/modules/auth/inscription/categories";

import InscriptionOrganisationClient from "./InscriptionOrganisationClient";

export const metadata = PAGES.dynamic.authInscription().getMetadata();

const isCategorie = (value: string): value is CategorieCompteInscription =>
  categoriesCompteInscription.some((categorie) => categorie.value === value);

export default async function Page({ params }: { params: Promise<{ typeOrganisation: string }> }) {
  const { typeOrganisation } = await params;

  if (!isCategorie(typeOrganisation)) {
    notFound();
  }

  return <InscriptionOrganisationClient typeOrganisation={typeOrganisation} />;
}
