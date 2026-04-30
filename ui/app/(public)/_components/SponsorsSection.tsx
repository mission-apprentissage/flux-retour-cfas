import Image from "next/image";

import styles from "./sponsors-section.module.scss";

type Sponsor = {
  image: { src: string; width: number; height: number } | null;
  title: string;
  description: string;
};

const SPONSORS: Array<Sponsor> = [
  {
    image: { src: "/images/home/ml-actives.png", width: 360, height: 246 },
    title: "+ 200 Missions Locales actives",
    description: "Un réseau de Missions Locales déjà actives sur le service",
  },
  {
    image: { src: "/images/home/made-in-DGEFP.png", width: 360, height: 200 },
    title: "Un service proposé par la DGEFP",
    description: "Un service co-construit avec les acteurs terrain CFA et Missions Locales directement",
  },
  {
    image: null,
    title: "+ XXX établissements de formation",
    description: "Les CFA choisissent le Tableau de bord pour collaborer avec les Missions Locales.",
  },
];

function SponsorItem({ image, title, description }: Sponsor) {
  return (
    <div className={styles.item}>
      {image ? (
        <Image className={styles.image} src={image.src} alt="" width={image.width} height={image.height} />
      ) : (
        <div className={styles.image} role="presentation" />
      )}
      <div className={styles.textContainer}>
        <p className={styles.title}>{title}</p>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
}

export function SponsorsSection() {
  return (
    <section className={styles.section} aria-label="Chiffres clés du service">
      <h2 className={styles.srOnly}>Le service en chiffres</h2>
      {SPONSORS.map((sponsor) => (
        <SponsorItem key={sponsor.title} {...sponsor} />
      ))}
    </section>
  );
}
