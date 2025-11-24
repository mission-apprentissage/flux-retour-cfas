import { StatCard } from "./StatCard";

interface TraitementStats {
  total: number;
  total_contacte: number;
  total_repondu: number;
  total_accompagne: number;
}

interface TraitementCardsProps {
  latestStats?: TraitementStats;
  firstStats?: TraitementStats;
  loading?: boolean;
}

export function TraitementCards({ latestStats, firstStats, loading = false }: TraitementCardsProps) {
  return (
    <>
      <StatCard
        label="Total jeunes identifiés en rupture"
        value={latestStats?.total}
        previousValue={firstStats?.total}
        loading={loading}
      />
      <StatCard
        label="Total jeunes contactés par les Missions locales"
        value={latestStats?.total_contacte}
        previousValue={firstStats?.total_contacte}
        loading={loading}
      />
      <StatCard
        label="Total jeunes ayant répondu"
        value={latestStats?.total_repondu}
        previousValue={firstStats?.total_repondu}
        loading={loading}
      />
      <StatCard
        label="Total jeunes accompagnés"
        value={latestStats?.total_accompagne}
        previousValue={firstStats?.total_accompagne}
        loading={loading}
        tooltip={
          <>
            Les &quot;jeunes accompagnés&quot; représentent la somme :
            <ul>
              <li>
                Des jeunes non connus du service public à l&apos;emploi qui ont obtenu un rdv avec une Mission locale
                grâce au TBA (RDV pris)
              </li>
              <li>Les jeunes déjà connus et accompagnés par le service public à l&apos;emploi</li>
            </ul>
          </>
        }
      />
    </>
  );
}
