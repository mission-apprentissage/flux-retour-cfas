import { redirect } from "next/navigation";
import { ORGANISATION_TYPE } from "shared";

import { getSession } from "@/app/_utils/session.utils";

import styles from "./organismes-fond.module.css";

export default async function OrganismesLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  const organisationType = user?.organisation?.type;

  if (organisationType !== ORGANISATION_TYPE.ADMINISTRATEUR && organisationType !== ORGANISATION_TYPE.TETE_DE_RESEAU) {
    redirect("/");
  }

  return <div className={styles.fond}>{children}</div>;
}
