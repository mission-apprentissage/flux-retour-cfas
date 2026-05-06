import Image from "next/image";

import styles from "./base-sponsors-section.module.scss";

export type Sponsor = {
  image: { src: string; width: number; height: number } | null;
  title: string;
  description: string;
};

function SponsorItem({ image, title, description }: Sponsor) {
  return (
    <div className={styles.item}>
      {image ? (
        <Image
          className={styles.image}
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          sizes="(max-width: 768px) 100px, 100px"
        />
      ) : (
        <div className={styles.image} aria-hidden="true" />
      )}
      <div className={styles.textContainer}>
        <p className={styles.title}>{title}</p>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
}

export function BaseSponsorsSection({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <section className={styles.section} aria-label="Chiffres clés du service">
      <h2 className={styles.srOnly}>Le service en chiffres</h2>
      {sponsors.map((sponsor) => (
        <SponsorItem key={sponsor.title} {...sponsor} />
      ))}
    </section>
  );
}
