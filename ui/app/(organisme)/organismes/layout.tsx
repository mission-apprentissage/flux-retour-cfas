import styles from "./organismes-fond.module.css";

export default function OrganismesLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.fond}>{children}</div>;
}
