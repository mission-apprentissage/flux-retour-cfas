import styles from "./inscription-form.module.scss";

export function RequiredMark() {
  return <span className={styles.requiredMark}>*</span>;
}
