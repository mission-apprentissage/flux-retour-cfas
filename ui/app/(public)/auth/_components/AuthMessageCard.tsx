import type { ReactNode } from "react";

import styles from "./auth-message-card.module.scss";

type Tone = "info" | "success" | "warning" | "error";

const ICON_TONE: Record<Tone, string> = {
  info: styles.iconWrapInfo,
  success: styles.iconWrapSuccess,
  warning: styles.iconWrapWarning,
  error: styles.iconWrapError,
};

export function AuthMessageCard({
  icon,
  tone = "info",
  title,
  children,
  actions,
  footer,
}: {
  icon: ReactNode;
  tone?: Tone;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className={styles.wrapper}>
      <div className={styles.card}>
        <div className={`${styles.iconWrap} ${ICON_TONE[tone]}`}>
          {typeof icon === "string" ? <i className={`${icon} ${styles.icon}`} aria-hidden="true" /> : icon}
        </div>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.lead}>{children}</div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </main>
  );
}
