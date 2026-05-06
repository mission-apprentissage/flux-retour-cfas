import { BaseSponsorsSection, type Sponsor } from "./shared/BaseSponsorsSection";

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

export function SponsorsSection() {
  return <BaseSponsorsSection sponsors={SPONSORS} />;
}
