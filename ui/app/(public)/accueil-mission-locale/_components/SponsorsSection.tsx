import { BaseSponsorsSection, type Sponsor } from "../../_components/shared/BaseSponsorsSection";

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
    image: { src: "/images/home/cfas.png", width: 360, height: 246 },
    title: "+1000 CFA",
    description: "De nombreux CFA sont déjà connectés sur tout le territoire.",
  },
];

export function SponsorsSection() {
  return <BaseSponsorsSection sponsors={SPONSORS} />;
}
