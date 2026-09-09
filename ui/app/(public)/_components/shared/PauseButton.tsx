import styles from "./pause-button.module.scss";

export function PauseButton({
  isPaused,
  togglePause,
  className,
}: {
  isPaused: boolean;
  togglePause: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={togglePause}
      className={`${styles.pauseButton} ${className || ""}`}
      aria-pressed={isPaused}
      aria-label={isPaused ? "Reprendre l’animation" : "Mettre en pause l’animation"}
    >
      <span aria-hidden="true" className={styles.pauseButtonLabel}>
        {isPaused ? "Reprendre l’animation" : "Mettre en pause l’animation"}
      </span>
      <span className={isPaused ? "fr-icon-play-line" : "fr-icon-pause-circle-line"} aria-hidden="true" />
    </button>
  );
}
