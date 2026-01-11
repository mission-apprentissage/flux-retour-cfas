import { DOSSIERS_TRAITES_COLORS } from "../constants";

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
                <BulletItem color={DOSSIERS_TRAITES_COLORS.rdv_pris}>Rendez-vous pris</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.nouveau_projet}>Nouveau projet</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.contacte_sans_retour}>À recontacter</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.deja_accompagne}>
                  Déjà suivi par le service public à l&apos;emploi
                </BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.injoignables}>Injoignable</BulletItem>
              </ul>
              <TooltipText spaced>sont exclus</TooltipText>
              <ul className={styles.bulletList}>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.coordonnees_incorrectes}>Mauvaises coordonnées</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.autre}>Autre</BulletItem>
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
                <BulletItem color={DOSSIERS_TRAITES_COLORS.rdv_pris}>Rendez-vous pris</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.nouveau_projet}>Nouveau projet</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.deja_accompagne}>
                  Déjà suivi par le service public à l&apos;emploi
                </BulletItem>
              </ul>
              <TooltipText spaced>sont exclus</TooltipText>
              <ul className={styles.bulletList}>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.contacte_sans_retour}>À recontacter</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.coordonnees_incorrectes}>Mauvaises coordonnées</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.injoignables}>Injoignable</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.autre}>Autre</BulletItem>
              </ul>
            </TooltipContent>
          </TooltipWrapper>
        }
      />
      <StatCard
        label="Total jeunes accompagnés"
        value={latestStats?.total_accompagne}
        previousValue={firstStats?.total_accompagne}
        loading={loading}
        loadingPercentage={loadingPercentage}
        tooltip={
          <TooltipWrapper>
            <TooltipHeader>Total jeunes accompagnés</TooltipHeader>
            <TooltipContent>
              <TooltipText>
                Les jeunes accompagnés sont l&apos;ensemble des jeunes détectés par le Tableau de bord qui sont déjà
                accompagnés par le service public ou qui ont obtenu un rendez-vous grâce à la mise en relation.
              </TooltipText>
              <TooltipText spaced>Parmi les dossiers de ces jeunes vous retrouvez :</TooltipText>
              <ul className={styles.bulletList}>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.rdv_pris}>Rendez-vous pris</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.deja_accompagne}>
                  Déjà suivi par le service public à l&apos;emploi
                </BulletItem>
              </ul>
              <TooltipText spaced>sont exclus</TooltipText>
              <ul className={styles.bulletList}>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.nouveau_projet}>Nouveau projet</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.contacte_sans_retour}>À recontacter</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.coordonnees_incorrectes}>Mauvaises coordonnées</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.injoignables}>Injoignable</BulletItem>
                <BulletItem color={DOSSIERS_TRAITES_COLORS.autre}>Autre</BulletItem>
              </ul>
            </TooltipContent>
          </TooltipWrapper>
        }
      />
    </>
  );
}
