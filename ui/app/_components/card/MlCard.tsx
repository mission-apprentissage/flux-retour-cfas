import Image from "next/image";
import React, { ReactNode } from "react";

import styles from "./MlCard.module.css";

export interface MlCardProps {
  title: string;
  subtitle?: string;
  body?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
}

export function MlCard({ title, subtitle, body, imageSrc, imageAlt }: MlCardProps) {
  return (
    <div className={styles.mlCardContainer}>
      <h3 className={`fr-h3 ${styles.mlCardTitle}`}>{title}</h3>

      {subtitle && <h6 className={`${styles.mlCardSubtitle}`}>{subtitle}</h6>}

      {imageSrc && (
        <Image src={imageSrc} alt={imageAlt || ""} width={350} height={250} className={styles.mlCardImage} />
      )}

      {body && <div className={styles.mlCardBody}>{body}</div>}
    </div>
  );
}
