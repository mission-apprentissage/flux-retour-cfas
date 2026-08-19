import { ReactNode } from "react";

import { DsfrLink } from "@/app/_components/link/DsfrLink";

import styles from "./page-header.module.scss";

export function PageHeader({
  title,
  intro,
  action,
  backLink,
}: {
  title: ReactNode;
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
