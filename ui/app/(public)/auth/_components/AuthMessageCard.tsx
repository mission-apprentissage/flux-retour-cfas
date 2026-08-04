import type { ReactNode } from "react";

import styles from "./auth-message-card.module.scss";

type Tone = "info" | "success" | "warning";

const ICON_TONE: Record<Tone, string> = {
  info: styles.iconWrapInfo,
  success: styles.iconWrapSuccess,
  warning: styles.iconWrapWarning,
};

export function AuthMessageCard({
  icon,
  tone = "info",
  title,
  children,
  actions,
}: {
  icon: string;
  tone?: Tone;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={`${styles.iconWrap} ${ICON_TONE[tone]}`}>
          <i className={`${icon} ${styles.icon}`} aria-hidden="true" />
        </div>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.lead}>{children}</div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </div>
  );
}
