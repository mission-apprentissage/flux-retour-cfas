import { BaseSponsorsSection, type Sponsor } from "../../_components/shared/BaseSponsorsSection";

const SPONSORS: Array<Sponsor> = [
  {
    image: { src: "/images/home/ml-actives.png", width: 360, height: 246 },
    title: "+ 200 Missions Locales disponibles",
    description: "Un réseau de Missions Locales déjà actives sur le service",
  },
  {
    image: { src: "/images/home/made-in-DGEFP.png", width: 360, height: 200 },
    title: "Un service proposé par la DGEFP",
    description: "Un service co-construit avec les acteurs terrain CFA et Missions Locales directement",
  },
  {
    image: { src: "/images/home/qualiopi.png", width: 360, height: 264 },
    title: "Valorisez votre engagement",
    description: "Vos actions de lutte contre le décrochage sont valorisables sur le service",
  },
];

export function SponsorsSection() {
  return <BaseSponsorsSection sponsors={SPONSORS} />;
}
