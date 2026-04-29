import { DOSSIERS_TRAITES_V2_COLORS } from "../constants";

import { StatCard } from "./StatCard";
import styles from "./TraitementCards.module.css";

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
  loadingPercentage?: boolean;
}

const TooltipWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.tooltipWrapper}>{children}</div>
);

const TooltipHeader = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.tooltipHeader}>
    <i className={`fr-icon-question-line ${styles.tooltipHeaderIcon}`} aria-hidden="true" />
    <span className={styles.tooltipHeaderTitle}>{children}</span>
  </div>
);

const TooltipContent = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.tooltipContent}>{children}</div>
);

const TooltipText = ({ children, spaced }: { children: React.ReactNode; spaced?: boolean }) => (
  <p className={spaced ? styles.tooltipTextSpaced : styles.tooltipText}>{children}</p>
);

const BulletItem = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <li className={styles.bulletItem}>
    <span className={styles.bulletDot} style={{ backgroundColor: color }} />
    {children}
  </li>
);

export function TraitementCards({
  latestStats,
  firstStats,
  loading = false,
  loadingPercentage = false,
}: TraitementCardsProps) {
  return (
    <>
      <StatCard
        label="Total jeunes identifiés en rupture"
        value={latestStats?.total}
        previousValue={firstStats?.total}
        loading={loading}
        loadingPercentage={loadingPercentage}
      />
      <StatCard
        label="Total jeunes contactés par les Missions Locales"
        value={latestStats?.total_contacte}
        previousValue={firstStats?.total_contacte}
        loading={loading}
        loadingPercentage={loadingPercentage}
        tooltip={
          <TooltipWrapper>
            <TooltipHeader>Total jeunes contactés par les Missions locales</TooltipHeader>
            <TooltipContent>
              <TooltipText>
                Les jeunes contactés sont l&apos;ensemble des dossiers que les MiLo ont pu traiter en ayant fait au
                moins une tentative de contact.
              </TooltipText>
              <TooltipText spaced>Parmi les dossiers de ces jeunes vous retrouvez :</TooltipText>
              <ul className={styles.bulletList}>
                <BulletItem color={DOSSIERS_TRAITES_V2_COLORS.rdv_pris}>Rendez-vous pris</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_V2_COLORS.projet_pro_securise}>Projet pro déjà sécurisé</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_V2_COLORS.ne_souhaite_pas_accompagnement}>
                  Ne souhaite pas être accompagné
                </BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_V2_COLORS.a_recontacter}>À recontacter</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_V2_COLORS.injoignable}>Injoignable</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_V2_COLORS.autre}>Autre</BulletItem>
              </ul>
            </TooltipContent>
          </TooltipWrapper>
        }
      />
      <StatCard
        label="Total jeunes ayant répondu"
        value={latestStats?.total_repondu}
        previousValue={firstStats?.total_repondu}
        loading={loading}
        loadingPercentage={loadingPercentage}
        tooltip={
          <TooltipWrapper>
            <TooltipHeader>Total jeunes ayant répondu</TooltipHeader>
            <TooltipContent>
              <TooltipText>
                Les jeunes ayant répondu sont l&apos;ensemble des dossiers traités par les MiLo en contactant un jeune
                et en obtenant une réponse de sa part.
              </TooltipText>
              <TooltipText spaced>Parmi les dossiers de ces jeunes vous retrouvez :</TooltipText>
              <ul className={styles.bulletList}>
                <BulletItem color={DOSSIERS_TRAITES_V2_COLORS.rdv_pris}>Rendez-vous pris</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_V2_COLORS.projet_pro_securise}>Projet pro déjà sécurisé</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_V2_COLORS.ne_souhaite_pas_accompagnement}>
                  Ne souhaite pas être accompagné
                </BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_V2_COLORS.autre}>Autre</BulletItem>
              </ul>
              <TooltipText spaced>sont exclus</TooltipText>
              <ul className={styles.bulletList}>
                <BulletItem color={DOSSIERS_TRAITES_V2_COLORS.a_recontacter}>À recontacter</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_V2_COLORS.injoignable}>Injoignable</BulletItem>
              </ul>
            </TooltipContent>
          </TooltipWrapper>
        }
      />
      <StatCard
        label="Total jeunes accompagnés découverts par le service"
        value={latestStats?.total_accompagne}
        previousValue={firstStats?.total_accompagne}
        loading={loading}
        loadingPercentage={loadingPercentage}
        tooltip={
          <TooltipWrapper>
            <TooltipHeader>Total jeunes accompagnés découverts par le service</TooltipHeader>
            <TooltipContent>
              <TooltipText>
                Ces jeunes ont été découverts par les Missions Locales grâce au Tableau de bord de l&apos;apprentissage
                et y ont pris rendez-vous.
              </TooltipText>
              <TooltipText spaced>Parmi les dossiers de ces jeunes vous retrouvez :</TooltipText>
              <ul className={styles.bulletList}>
                <BulletItem color={DOSSIERS_TRAITES_V2_COLORS.rdv_pris}>Rendez-vous pris</BulletItem>
              </ul>
              <TooltipText spaced>sont exclus</TooltipText>
              <TooltipText>Les jeunes déjà connus et accompagnés par les Missions Locales.</TooltipText>
            </TooltipContent>
          </TooltipWrapper>
        }
      />
    </>
  );
}
