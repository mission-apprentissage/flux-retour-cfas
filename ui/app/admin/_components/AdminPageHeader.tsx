import { ReactNode } from "react";

import { DsfrLink } from "@/app/_components/link/DsfrLink";

import styles from "./admin-page.module.scss";

export function AdminPageHeader({
  title,
  intro,
  action,
  backLink,
}: {
  title: string;
  intro?: ReactNode;
  action?: ReactNode;
  backLink?: { href: string; label: string };
}) {
  return (
    <>
      {backLink && (
        <div className={styles.backLink}>
          <DsfrLink href={backLink.href} arrow="left">
            {backLink.label}
          </DsfrLink>
        </div>
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {action}
      </div>

      {intro ? <p className={styles.intro}>{intro}</p> : <div className={styles.headerSpacer} />}
    </>
  );
}
