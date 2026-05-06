import type { CSSProperties } from "react";

import styles from "./pause-button.module.scss";

export function PauseButton({
  isPaused,
  togglePause,
  style,
}: {
  isPaused: boolean;
  togglePause: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={togglePause}
      className={styles.pauseButton}
      style={style}
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
