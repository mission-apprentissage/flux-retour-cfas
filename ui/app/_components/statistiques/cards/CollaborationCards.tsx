import type { ICollaborationSegmentStats } from "shared/models/data/nationalStats.model";

import { StatCard } from "./StatCard";

interface CollaborationCardsProps {
  data?: ICollaborationSegmentStats;
  loading: boolean;
  loadingPercentage?: boolean;
  cardClassName?: string;
}

export function CollaborationCards({
  data,
  loading,
  loadingPercentage = false,
  cardClassName,
}: CollaborationCardsProps) {
  return (
    <>
      <StatCard
        label="Total CFA qui ont déjà collaboré au moins une fois"
        value={data?.cfa_ayant_collabore.current}
        variation={data?.cfa_ayant_collabore.variation}
        loading={loading}
        loadingPercentage={loadingPercentage}
        tooltip="CFA du territoire ayant envoyé au moins un dossier de collaboration, quelle que soit la région de la Mission Locale. Sur la fiche d'une Mission Locale : CFA lui ayant envoyé un dossier."
        className={cardClassName}
      />
      <StatCard
        label="Total jeunes envoyés par les CFA aux Missions Locales"
        value={data?.jeunes_envoyes.current}
        variation={data?.jeunes_envoyes.variation}
        loading={loading}
        loadingPercentage={loadingPercentage}
        tooltip="Dossiers de collaboration envoyés par les CFA du territoire, quelle que soit la région de la Mission Locale. Le tableau par région ne compte que les CFA dont la collaboration est activée : ses totaux peuvent légèrement différer. Sur la fiche d'une Mission Locale : dossiers qu'elle a reçus."
        className={cardClassName}
      />
      <StatCard
        label="Total jeunes contactés par les Missions Locales"
        value={data?.jeunes_contactes.current}
        variation={data?.jeunes_contactes.variation}
        loading={loading}
        loadingPercentage={loadingPercentage}
        tooltip="Dossiers de collaboration pour lesquels la Mission Locale a renseigné une situation, y compris « à recontacter »."
        className={cardClassName}
      />
      <StatCard
        label="Total jeunes ayant accepté l'accompagnement de la Mission Locale"
        value={data?.jeunes_accompagnement_accepte.current}
        variation={data?.jeunes_accompagnement_accepte.variation}
        loading={loading}
        loadingPercentage={loadingPercentage}
        tooltip="Dossiers de collaboration pour lesquels un rendez-vous a été pris avec la Mission Locale."
        className={cardClassName}
      />
    </>
  );
}
