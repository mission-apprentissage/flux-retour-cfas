import styles from "@/app/_components/layouts/pageContainer.module.css";

export function MlContainer({ children }: { children: React.ReactNode }) {
  return <div className={styles.container}>{children}</div>;
}
