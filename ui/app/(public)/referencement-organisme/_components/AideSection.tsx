"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import type { ReactNode } from "react";

import styles from "./aide-section.module.scss";

export function AideTitle({ children }: { children: ReactNode }) {
  return <h2 className={styles.title}>{children}</h2>;
}

export function AideHeader({ children }: { children: ReactNode }) {
  return (
    <div className={styles.header}>
      {children}
      <hr className={styles.divider} />
    </div>
  );
}

export function AideContainer({ children, sidebarContent }: { children: ReactNode; sidebarContent?: ReactNode }) {
  return (
    <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
      <div className={fr.cx("fr-col-12", "fr-col-lg-8")}>{children}</div>
      <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>{sidebarContent}</div>
    </div>
  );
}

export function AideDataResponsibility({
  dataResponsibilityText,
  dataResponsibilityLink,
  modificationText,
  modificationLink,
  onDataResponsibilityClick,
  onModificationClick,
}: {
  dataResponsibilityText: string;
  dataResponsibilityLink: string;
  modificationText: string;
  modificationLink: string;
  onDataResponsibilityClick?: () => void;
  onModificationClick?: () => void;
}) {
  return (
    <div className={styles.responsibility}>
      <p className={styles.responsibilityItem}>
        <span>Responsable de la donnée :</span>
        <Tag
          linkProps={{
            href: dataResponsibilityLink,
            target: "_blank",
            rel: "noopener noreferrer",
            onClick: onDataResponsibilityClick,
          }}
        >
          {dataResponsibilityText}
        </Tag>
      </p>
      <p className={styles.responsibilityItem}>
        <span>Modification de la donnée :</span>
        <Tag
          linkProps={{
            href: modificationLink,
            target: "_blank",
            rel: "noopener noreferrer",
            onClick: onModificationClick,
          }}
        >
          {modificationText}
        </Tag>
      </p>
    </div>
  );
}

export function AideRibbon({ title, content, children }: { title: string; content: ReactNode; children?: ReactNode }) {
  return (
    <div className={`${fr.cx("fr-callout")} ${styles.ribbon}`}>
      <p className={fr.cx("fr-callout__title")}>{title}</p>
      <p className={fr.cx("fr-callout__text")}>{content}</p>
      {children}
    </div>
  );
}

export function AideExampleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className={`${fr.cx("fr-link", "fr-link--icon-left", "fr-icon-zoom-in-line")} ${styles.exampleButton}`}
      onClick={onClick}
    >
      Voir un exemple
    </button>
  );
}

export function AideSidebarInfos({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className={`${styles.sidebarCard} ${styles.sidebarInfos}`}>
      <p className={styles.sidebarTitle}>{title}</p>
      <div className={styles.sidebarBody}>{children}</div>
    </aside>
  );
}

export function AideSidebarTips({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className={`${styles.sidebarCard} ${styles.sidebarTips}`}>
      <p className={styles.sidebarTitle}>{title}</p>
      <div className={styles.sidebarBody}>{children}</div>
    </aside>
  );
}

export function AideLink({ href, children }: { href: string; children: ReactNode }) {
  const isExternal = /^https?:/.test(href);

  return (
    <a
      href={href}
      className={fr.cx("fr-link")}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export function AideDownloadLink({
  href,
  children,
  fileType,
  fileSize,
  onClick,
}: {
  href: string;
  children: ReactNode;
  fileType: string;
  fileSize: string;
  onClick?: () => void;
}) {
  return (
    <span className={styles.downloadLink}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        download
        className={fr.cx("fr-link", "fr-link--icon-right", "fr-icon-download-line")}
      >
        {children}
      </a>
      <span className={styles.downloadMeta}>
        {fileType} - {fileSize}
      </span>
    </span>
  );
}

export function AideFileCard({
  category,
  title,
  description,
  fileType,
  fileSize,
  downloadLink,
  onClick,
}: {
  category: string;
  title: string;
  description: string;
  fileType: string;
  fileSize: string;
  downloadLink: string;
  onClick?: () => void;
}) {
  return (
    <a
      href={downloadLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={styles.fileCard}
      download
    >
      <i className={`${fr.cx("fr-icon-file-text-line")} ${styles.fileCardIcon}`} aria-hidden="true" />
      <span className={styles.fileCardBody}>
        <span className={styles.fileCardCategory}>{category}</span>
        <span className={styles.fileCardTitle}>{title}</span>
        <span className={styles.fileCardDescription}>{description}</span>
        <span className={styles.fileCardMeta}>
          <span>
            {fileType} - {fileSize}
          </span>
          <i className={fr.cx("fr-icon-download-line")} aria-hidden="true" />
        </span>
      </span>
    </a>
  );
}

export function AideExampleImage({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={styles.exampleImage} />;
}
