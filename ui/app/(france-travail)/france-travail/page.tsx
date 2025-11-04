import { redirect } from "next/navigation";
import { TOUS_LES_SECTEURS_CODE } from "shared/constants/franceTravail";

export default function Page() {
  redirect(`/france-travail/${TOUS_LES_SECTEURS_CODE}`);
}
