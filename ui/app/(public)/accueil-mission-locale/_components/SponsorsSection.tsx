import { SponsorsSection as BaseSponsorsSection, type Sponsor } from "../../_components/SponsorsSection";

import styles from "./sponsors-section.module.scss";

const SPONSORS: Array<Sponsor> = [
  {
    image: { src: "/images/home/ml-actives.png", width: 360, height: 246 },
    title: "+ 200 Missions Locales l'ont adopté",
    description:
      "De nombreuses Missions Locales l'ont ajouté à leur quotidien pour lutter contre le décrochage et les fractures de parcours.",
  },
  {
    image: { src: "/images/home/made-in-DGEFP.png", width: 360, height: 200 },
    title: "Un service proposé par la DGEFP",
    description: "Un service co-construit avec les acteurs terrain CFA et Missions Locales directement",
  },
  {
    image: null,
    title: "Des CFA engagés",
    description:
      "Le service se déploie sur les territoires avec des CFA engagés pour qualifier les dossiers de rupture et collaborer.",
  },
];

export function SponsorsSection() {
  return <BaseSponsorsSection sponsors={SPONSORS} styles={styles} />;
}
