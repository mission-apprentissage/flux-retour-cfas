"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { useState } from "react";

import { DropdownMenu, DropdownMenuButton, DropdownMenuLink } from "@/app/_components/common/DropdownMenu";
import { TableSkeleton } from "@/app/_components/common/Skeleton";
import InvitationSidePanel from "@/app/_components/roles-habilitations/InvitationSidePanel";
import { _delete } from "@/common/httpClient";

import {
  statsQueryKeys,
  useMissionLocaleMembres,
  type IMissionLocaleMemberResponse,
} from "../../hooks/useStatsQueries";
import ficheTableStyles from "../../tables/FicheTable.module.css";
import { CopyButton } from "../../ui/CopyButton";
import { StatsErrorHandler } from "../../ui/StatsErrorHandler";
import { formatDateCourte } from "../../utils";

import styles from "./MLEquipeTab.module.css";

const supprimerMembreModal = createModal({ id: "ml-equipe-supprimer-membre", isOpenedByDefault: false });

const EMPTY_MESSAGE = "Cette Mission Locale n'utilise pas encore le Tableau de bord";

interface MLEquipeTabProps {
  mlId: string;
  isAdmin?: boolean;
}

const formatCivility = (civility: string) => {
  if (civility === "Monsieur") return "M.";
  if (civility === "Madame") return "Mme";
  return "";
};

const formatNomComplet = (membre: IMissionLocaleMemberResponse) =>
  [membre.prenom, membre.nom].filter(Boolean).join(" ") || "cet utilisateur";

function DateRelative({ date, vide }: { date: string | null; vide: string }) {
  if (!date) return <span className={styles.vide}>{vide}</span>;
  return (
    <span className={styles.date}>
      <span>{formatDateCourte(date)}</span>
      <span className={styles.relatif}>
        {formatDistanceToNow(new Date(date), { locale: frLocale, addSuffix: true })}
      </span>
    </span>
  );
}

export function MLEquipeTab({ mlId, isAdmin = false }: MLEquipeTabProps) {
  const { data, isLoading, error } = useMissionLocaleMembres(mlId);
  const queryClient = useQueryClient();
  const [membreASupprimer, setMembreASupprimer] = useState<IMissionLocaleMemberResponse | null>(null);
  const [suppressionErreur, setSuppressionErreur] = useState<string | null>(null);
  const [invitationOuverte, setInvitationOuverte] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState<string | null>(null);

  useIsModalOpen(supprimerMembreModal, {
    onConceal: () => setMembreASupprimer(null),
  });

  const demanderSuppression = (membre: IMissionLocaleMemberResponse) => {
    setSuppressionErreur(null);
    setMembreASupprimer(membre);
    supprimerMembreModal.open();
  };

  const supprimer = async () => {
    if (!membreASupprimer) return;
    try {
      await _delete(`/api/v1/admin/users/${membreASupprimer._id}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: statsQueryKeys.missionLocaleMembres(mlId) }),
        queryClient.invalidateQueries({ queryKey: statsQueryKeys.missionLocaleDetail(mlId) }),
      ]);
    } catch {
      setSuppressionErreur("La suppression a échoué. Merci de réessayer.");
    }
  };

  const headers = ["Civilité Nom et prénom", "Téléphone", "Courriel", "Dernière activité", "Date d'activation"];
  if (isAdmin) headers.push("Actions");

  const membres = data ?? [];

  return (
    <div>
      <h2 className={styles.titre}>Équipe</h2>
      <p className={styles.intro}>
        Retrouvez ici les utilisateurs du Tableau de bord dans cette Mission Locale. Cette liste d&apos;équipe ne
        représente pas l&apos;ensemble de l&apos;équipe pédagogique et opérationnelle de la Mission Locale.
      </p>

      {isAdmin && (
        <div className={styles.barreActions}>
          <Button
            priority="secondary"
            iconId="fr-icon-user-add-line"
            iconPosition="right"
            onClick={() => {
              setInvitationMessage(null);
              setInvitationOuverte(true);
            }}
          >
            Inviter un utilisateur
          </Button>
        </div>
      )}

      {invitationMessage && (
        <Alert
          severity="success"
          title={invitationMessage}
          description="Les personnes invitées apparaîtront dans l'équipe une fois leur compte activé."
          small
          closable
          onClose={() => setInvitationMessage(null)}
          className="fr-mb-2w"
        />
      )}

      {suppressionErreur && (
        <div className="fr-alert fr-alert--error fr-alert--sm fr-mb-2w" role="alert">
          <p>{suppressionErreur}</p>
        </div>
      )}

      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        {isLoading ? (
          <TableSkeleton rows={3} />
        ) : (
          <div className={`fr-table ${ficheTableStyles.table} ${styles.table}`}>
            <table>
              <caption className="fr-sr-only">Utilisateurs du Tableau de bord de la Mission Locale</caption>
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
                  <tr>
                    <td colSpan={headers.length} className={styles.celluleVide}>
                      <p className={styles.etatVide}>
                        <span className="fr-icon-information-fill fr-icon--sm" aria-hidden="true" />
                        {EMPTY_MESSAGE}
                      </p>
                    </td>
                  </tr>
                ) : (
                  membres.map((membre) => (
                    <tr key={membre._id}>
                      <td>
                        <strong className={styles.nom}>
                          {[formatCivility(membre.civility), membre.nom.toUpperCase()].filter(Boolean).join(" ")}
                          <br />
                          {membre.prenom}
                        </strong>
                      </td>
                      <td>{membre.telephone || "-"}</td>
                      <td>
                        {membre.email ? (
                          <span className={styles.courriel}>
                            <a href={`mailto:${membre.email}`} className="fr-link">
                              {membre.email}
                            </a>
                            <CopyButton value={membre.email} title="Copier l'adresse courriel" />
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <DateRelative date={membre.last_traitement_at} vide="Aucune activité" />
                      </td>
                      <td>
                        <DateRelative date={membre.confirmed_at} vide="-" />
                      </td>
                      {isAdmin && (
                        <td className={styles.actions}>
                          <DropdownMenu
                            buttonIconId="fr-icon-more-fill"
                            ariaLabel={`Actions pour ${formatNomComplet(membre)}`}
                            priority="tertiary"
                            size="small"
                          >
                            {() => (
                              <>
                                <DropdownMenuLink href={`/admin/users/${membre._id}`} icon="fr-icon-user-line">
                                  Voir les infos de l&apos;utilisateur
                                </DropdownMenuLink>
                                <DropdownMenuButton
                                  icon="fr-icon-delete-line"
                                  danger
                                  separator
                                  onClick={() => demanderSuppression(membre)}
                                >
                                  Supprimer l&apos;utilisateur
                                </DropdownMenuButton>
                              </>
                            )}
                          </DropdownMenu>
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

      {isAdmin && (
        <InvitationSidePanel
          isOpen={invitationOuverte}
          onClose={() => setInvitationOuverte(false)}
          onSuccess={(message) => {
            if (message) setInvitationMessage(message);
          }}
          endpoint={`/api/v1/admin/mission-locale/${mlId}/membres/invitations`}
          withRoles={false}
          submitLabel="Inviter ces utilisateurs"
          submitIconId="fr-icon-send-plane-fill"
        />
      )}

      {isAdmin && (
        <supprimerMembreModal.Component
          title="Supprimer l'utilisateur"
          buttons={[
            { children: "Annuler", doClosesModal: true, priority: "secondary" },
            { children: "Supprimer définitivement", doClosesModal: true, priority: "primary", onClick: supprimer },
          ]}
        >
          <p>
            Vous allez supprimer le compte de <strong>{membreASupprimer && formatNomComplet(membreASupprimer)}</strong>{" "}
            ({membreASupprimer?.email}). Il n&apos;aura plus accès au Tableau de bord. Cette action est irréversible.
          </p>
        </supprimerMembreModal.Component>
      )}
    </div>
  );
}
