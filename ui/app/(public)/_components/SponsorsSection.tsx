import Image from "next/image";

export type Sponsor = {
  image: { src: string; width: number; height: number } | null;
  title: string;
  description: string;
};

function SponsorItem({ image, title, description, styles }: Sponsor & { styles: Record<string, string> }) {
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
        <div className={styles.image} role="presentation" />
      )}
      <div className={styles.textContainer}>
        <p className={styles.title}>{title}</p>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
}

export function SponsorsSection({ sponsors, styles }: { sponsors: Sponsor[]; styles: Record<string, string> }) {
  return (
    <section className={styles.section} aria-label="Chiffres clés du service">
      <h2 className={styles.srOnly}>Le service en chiffres</h2>
      {sponsors.map((sponsor) => (
        <SponsorItem key={sponsor.title} {...sponsor} styles={styles} />
      ))}
    </section>
  );
}
