import { Accordion } from "@codegouvfr/react-dsfr/Accordion";

import styles from "./video-section.module.scss";

const YOUTUBE_VIDEO_ID = "";

export function VideoSection() {
  const hasVideo = Boolean(YOUTUBE_VIDEO_ID);
  const fullVideoUrl = `https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Les Missions Locales en parlent...</h2>
      <div className={styles.media}>
        <div className={styles.videoWrapper}>
          {hasVideo ? (
            <iframe
              className={styles.video}
              src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}`}
              title="Témoignages des Missions Locales"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className={styles.videoPlaceholder} role="img" aria-label="Vidéo à venir">
              Vidéo à venir
            </div>
          )}
        </div>
        <div className={styles.caption}>
          <p className={styles.captionText}>
            Vidéo de présentation de témoignages des Missions Locales qui ont co-construit le service
          </p>
          {hasVideo && (
            <a
              className={styles.captionLink}
              href={fullVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Voir la vidéo complète sur YouTube - nouvelle fenêtre"
            >
              Lien de la vidéo complète
              <span className="fr-icon-external-link-line" aria-hidden="true" />
            </a>
          )}
        </div>
        <Accordion label="Transcription">
          <p>TODO: rédiger la transcription de la vidéo.</p>
        </Accordion>
      </div>
    </section>
  );
}
