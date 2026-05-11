import { Accordion } from "@codegouvfr/react-dsfr/Accordion";

import styles from "./video-section.module.scss";

const YOUTUBE_VIDEO_ID = "Al8aSdWTw94";

export function VideoSection() {
  const fullVideoUrl = `https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Les Missions Locales en parlent...</h2>
      <div className={styles.media}>
        <figure className={`fr-content-media ${styles.figure}`} role="group">
          <div className={`fr-responsive-vid ${styles.videoWrapper}`}>
            <iframe
              className="fr-responsive-vid__player"
              src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}`}
              title="Témoignages des Missions Locales"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <figcaption className="fr-content-media__caption">
            Vidéo de présentation de témoignages des Missions Locales qui ont co-construit le service
            <a
              className="fr-link"
              href={fullVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Voir la vidéo complète sur YouTube - nouvelle fenêtre"
            >
              Lien de la vidéo complète
            </a>
          </figcaption>
        </figure>
        <Accordion label="Transcription">
          <p>
            Avant le lancement de notre service numérique, Alexandra Delohen, chargée de projet «&nbsp;Relations Réseau
            et Partenaires&nbsp;» à la Mission Locale Technowest Nouvelle-Aquitaine, et Carole Hyreza, responsable du
            pôle «&nbsp;Entreprises et Anticipations des Mutations Économiques&nbsp;» à la Mission Locale Insertion
            Formation Emploi du Grand Amiénois, nous ont partagé les difficultés rencontrées pour repérer les jeunes en
            rupture de contrat d&apos;apprentissage. Elles partagent le même constat : notre service numérique permet
            principalement d&apos;identifier des jeunes en rupture que la Mission locale ne connaît pas encore :
          </p>
          <p>
            «&nbsp;Il y a beaucoup de jeunes qu&apos;on connaissait, mais on n&apos;avait pas forcément eu
            l&apos;information qui nous disait que ce jeune avait rompu, parce que pour certains, là : le dernier
            c&apos;était novembre, on est aujourd&apos;hui le 29 avril, donc voilà, c&apos;est cette information là. Et
            à peu près 75% sur cette liste de 215, ce sont des jeunes qui ne connaissaient pas la Mission Locale a
            priori, puisqu&apos;en fait, ils n&apos;étaient pas dans notre base de données. Mais on a également accès
            aux jeunes rupturants qui ne connaissent pas forcément la Mission Locale, ou qui n&apos;ont jamais été
            inscrits à la Mission Locale. Et de ce fait, ça nous permet de prendre contact avec eux, et de leur proposer
            un accompagnement Mission Locale pour les aider dans leur recherche d&apos;un nouveau contrat.&nbsp;»
          </p>
          <p>
            Au-delà de ce repérage, Thibaut Cléry, référent «&nbsp;Formation et Alternance&nbsp;» à la Mission Locale du
            Beauvaisis, mentionne un autre avantage de notre service numérique : celui de multiplier les interactions
            avec les CFA :
          </p>
          <p>
            «&nbsp;C&apos;était d&apos;abord… de peut-être beaucoup plus interagir, en tout cas facilement, avec un
            certain nombre de CFA. Ça démultiplie les échanges, en tout cas, avec les CFA, pour dire :
            «&nbsp;Bah&nbsp;tiens, j&apos;ai ce jeune là qui apparaît, qu&apos;est-ce que tu en penses ? Où est-ce
            qu&apos;on en est ?&nbsp;» Lui allumer la lumière en disant : «&nbsp;N&apos;oublie pas de nous l&apos;
            orienter, au cas où&nbsp;». Ça permet de rappeler aussi les bonnes pratiques, qu&apos;on utilise avec un
            certain nombre de CFA. Donc ça, c&apos;est vraiment un plus pour nous.&nbsp;»
          </p>
          <p>
            À la question : «&nbsp;Recommanderiez-vous notre service public numérique ?&nbsp;», la réponse est unanime :
            oui. Plébiscité pour sa facilité d&apos;utilisation et son utilité dans l&apos;accompagnement des jeunes,
            notre service a convaincu les Missions Locales qui l&apos;ont expérimenté. Cette expérience positive les
            conduit aujourd&apos;hui à envisager un engagement à long terme dans le déploiement du service :
          </p>
          <p>
            «&nbsp;Je vais être directe avec vous, nous, on souhaite continuer en tout cas l&apos;expérimentation, et
            continuer la démarche avec vous. Même si au début, quand on a commencé l&apos;expérimentation, on s&apos;est
            retrouvés avec 150 jeunes à contacter, ça nous a un peu semblé beaucoup sur le moment. Mais finalement, on a
            trouvé une organisation, une articulation qui nous a permis de contacter tous les jeunes et puis d&apos;
            obtenir des rendez-vous.&nbsp;»
          </p>
          <p>
            «&nbsp;Je recommande vivement, et j&apos;ai déjà recommandé à mon collègue, qui n&apos;est pas très loin et
            qui est entré dans l&apos;expérimentation il y a 3 semaines. Donc oui je pense que c&apos;est un outil
            qu&apos;il faut généraliser certes, après il y a peut-être des Missions Locales qui n&apos;auront pas
            forcément le temps ou les moyens humains de pouvoir le gérer. Comme je disais, il faut y aller tous les 2-3
            jours, ça se met à jour régulièrement, donc pour être réactif au niveau des jeunes, il faut quand même
            qu&apos;on ait l&apos;information assez tôt. Dès sa rupture de contrat, il faut qu&apos;on aille le plus
            vite possible pour pouvoir le raccrocher.&nbsp;»
          </p>
          <p>
            Vous êtes un CFA ou une Mission Locale ? Engageons une collaboration durable pour soutenir l&apos;insertion
            des apprentis !
          </p>
        </Accordion>
      </div>
    </section>
  );
}
