"use client";

import { TableSkeleton } from "@/app/_components/common/Skeleton";

import { useCfaMembres, type ICfaMembreResponse } from "../../hooks/useStatsQueries";
import ficheTableStyles from "../../tables/FicheTable.module.css";
import { StatsErrorHandler } from "../../ui/StatsErrorHandler";

import { CourrielCopiable, DateRelative, EtatVideEquipe, NomMembre } from "./EquipeCellules";
import styles from "./EquipeTab.module.css";

const INVITATION_LIBELLES = {
  envoyee: { texte: "Invitation envoyée", classe: styles.invitationEnvoyee },
  expiree: { texte: "Invitation expirée", classe: styles.invitationExpiree },
};

function DerniereActivite({ membre }: { membre: ICfaMembreResponse }) {
  if (membre.invitation_statut) {
    const { texte, classe } = INVITATION_LIBELLES[membre.invitation_statut];
    return <span className={classe}>{texte}</span>;
  }
  return <DateRelative date={membre.derniere_activite_at} vide="Aucune connexion" />;
}

interface CfaEquipeTabProps {
  organismeId: string;
  isAdmin?: boolean;
}

export function CfaEquipeTab({ organismeId, isAdmin = false }: CfaEquipeTabProps) {
  const { data, isLoading, error } = useCfaMembres(organismeId);
  const membres = data ?? [];
  const headers = ["Civilité Nom et prénom", "Téléphone", "Courriel", "Intitulé de poste", "Dernière activité"];
  if (isAdmin) headers.push("Date d'activation");

  return (
    <div>
      <h2 className={styles.titre}>Équipe</h2>
      <p className={styles.intro}>
        Retrouvez ici les utilisateurs du Tableau de bord dans cet établissement. Cette liste d&apos;équipe ne
        représente pas l&apos;ensemble de l&apos;équipe pédagogique et opérationnelle de cet établissement.
      </p>

      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        {isLoading ? (
          <TableSkeleton rows={3} />
        ) : (
          <div className={`fr-table ${ficheTableStyles.table} ${styles.table}`}>
            <table>
              <caption className="fr-sr-only">Utilisateurs du Tableau de bord de l&apos;établissement</caption>
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={header} scope="col">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {membres.length === 0 ? (
                  <EtatVideEquipe colonnes={headers.length} message="Ce CFA n'utilise pas encore le Tableau de bord" />
                ) : (
                  membres.map((membre) => (
                    <tr key={`${membre.type}-${membre.id}`}>
                      <td>
                        <NomMembre civility={membre.civility} nom={membre.nom} prenom={membre.prenom} />
                      </td>
                      <td>{membre.telephone || "-"}</td>
                      <td>
                        <CourrielCopiable email={membre.email} />
                      </td>
                      <td>{membre.fonction || "-"}</td>
                      <td>
                        <DerniereActivite membre={membre} />
                      </td>
                      {isAdmin && (
                        <td>
                          <DateRelative date={membre.activation_at} vide="-" />
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </StatsErrorHandler>
    </div>
  );
}
