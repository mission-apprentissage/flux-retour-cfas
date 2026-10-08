"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { DropdownMenu, DropdownMenuButton, DropdownMenuLink } from "@/app/_components/common/DropdownMenu";
import { TableSkeleton } from "@/app/_components/common/Skeleton";
import InvitationSidePanel from "@/app/_components/roles-habilitations/InvitationSidePanel";
import { _delete, _post, _put } from "@/common/httpClient";
import { getApiErrorMessage } from "@/common/rateLimit";

import { cfaMembresQueryKey, useCfaMembres, type ICfaMembreResponse } from "../../hooks/useStatsQueries";
import ficheTableStyles from "../../tables/FicheTable.module.css";
import { StatsErrorHandler } from "../../ui/StatsErrorHandler";

import { CourrielCopiable, DateRelative, EtatVideEquipe, NomMembre } from "./EquipeCellules";
import styles from "./EquipeTab.module.css";

const confirmationModal = createModal({ id: "cfa-equipe-confirmation", isOpenedByDefault: false });

const INVITATION_LIBELLES = {
  envoyee: { texte: "Invitation envoyée", classe: styles.invitationEnvoyee },
  expiree: { texte: "Invitation expirée", classe: styles.invitationExpiree },
};

type Retour = { severity: "success" | "error"; message: string };
type Confirmation = { titre: string; texte: string; bouton: string; action: () => Promise<string> };

const nomAffiche = (membre: ICfaMembreResponse) =>
  [membre.prenom, membre.nom].filter(Boolean).join(" ") || membre.email;

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
  const queryClient = useQueryClient();
  const [retour, setRetour] = useState<Retour | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [invitationOuverte, setInvitationOuverte] = useState(false);

  useIsModalOpen(confirmationModal, { onConceal: () => setConfirmation(null) });

  const executer = async (action: () => Promise<string>, echec: string) => {
    setRetour(null);
    try {
      setRetour({ severity: "success", message: await action() });
      await queryClient.invalidateQueries({ queryKey: cfaMembresQueryKey(organismeId) });
    } catch (err) {
      setRetour({ severity: "error", message: getApiErrorMessage(err, echec) });
    }
  };

  const demander = (config: Confirmation) => {
    setRetour(null);
    setConfirmation(config);
    confirmationModal.open();
  };

  const supprimerUtilisateur = (membre: ICfaMembreResponse) =>
    demander({
      titre: "Supprimer l'utilisateur",
      texte: `Vous allez supprimer le compte de ${nomAffiche(membre)} (${membre.email}). Il n'aura plus accès au Tableau de bord. Cette action est irréversible.`,
      bouton: "Supprimer définitivement",
      action: async () => {
        await _delete(`/api/v1/admin/users/${membre.id}`);
        return `Le compte de ${nomAffiche(membre)} a été supprimé.`;
      },
    });

  const annulerInvitation = (membre: ICfaMembreResponse, titre: string) =>
    demander({
      titre,
      texte: `L'invitation envoyée à ${membre.email} ne pourra plus être utilisée.`,
      bouton: "Confirmer",
      action: async () => {
        await _delete(`/api/v1/admin/invitations/${membre.id}`);
        return `L'invitation de ${membre.email} a été annulée.`;
      },
    });

  const renvoyerInvitation = (membre: ICfaMembreResponse) =>
    executer(async () => {
      await _post(`/api/v1/admin/invitations/${membre.id}/resend`);
      return `L'invitation a été renvoyée à ${membre.email}.`;
    }, `Le renvoi de l'invitation à ${membre.email} a échoué.`);

  const passerAdmin = (membre: ICfaMembreResponse) =>
    executer(
      async () => {
        await _put(`/api/v1/admin/users/${membre.id}/role`, { role: "admin" });
        return `${nomAffiche(membre)} est maintenant administrateur du CFA.`;
      },
      `Le changement de rôle de ${nomAffiche(membre)} a échoué.`
    );

  const membres = data ?? [];
  const headers = ["Civilité Nom et prénom", "Téléphone", "Courriel", "Intitulé de poste", "Dernière activité"];
  if (isAdmin) headers.push("Date d'activation", "Actions");

  return (
    <div>
      <h2 className={styles.titre}>Équipe</h2>
      <p className={styles.intro}>
        Retrouvez ici les utilisateurs du Tableau de bord dans cet établissement. Cette liste d&apos;équipe ne
        représente pas l&apos;ensemble de l&apos;équipe pédagogique et opérationnelle de cet établissement.
      </p>

      {isAdmin && (
        <div className={styles.barreActions}>
          <Button
            priority="secondary"
            iconId="fr-icon-user-add-line"
            iconPosition="right"
            onClick={() => {
              setRetour(null);
              setInvitationOuverte(true);
            }}
          >
            Inviter un utilisateur
          </Button>
        </div>
      )}

      {retour && (
        <Alert
          severity={retour.severity}
          title={retour.message}
          description=""
          small
          closable
          onClose={() => setRetour(null)}
          className="fr-mb-2w"
        />
      )}

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
                        <>
                          <td>
                            <DateRelative date={membre.activation_at} vide="-" />
                          </td>
                          <td className={styles.actions}>
                            <DropdownMenu
                              buttonIconId="fr-icon-more-fill"
                              ariaLabel={`Actions pour ${nomAffiche(membre)}`}
                              priority="tertiary"
                              size="small"
                            >
                              {() =>
                                membre.type === "utilisateur" ? (
                                  <>
                                    <DropdownMenuLink href={`/admin/users/${membre.id}`} icon="fr-icon-user-line">
                                      Voir les infos de l&apos;utilisateur
                                    </DropdownMenuLink>
                                    {membre.role !== "admin" && (
                                      <DropdownMenuButton
                                        icon="fr-icon-user-star-line"
                                        onClick={() => passerAdmin(membre)}
                                      >
                                        Passer en admin du CFA
                                      </DropdownMenuButton>
                                    )}
                                    <DropdownMenuButton
                                      icon="fr-icon-delete-line"
                                      danger
                                      separator
                                      onClick={() => supprimerUtilisateur(membre)}
                                    >
                                      Supprimer l&apos;utilisateur
                                    </DropdownMenuButton>
                                  </>
                                ) : membre.invitation_statut === "expiree" ? (
                                  <>
                                    <DropdownMenuButton
                                      icon="fr-icon-mail-line"
                                      onClick={() => renvoyerInvitation(membre)}
                                    >
                                      Renvoyer l&apos;invitation
                                    </DropdownMenuButton>
                                    <DropdownMenuButton
                                      icon="fr-icon-delete-line"
                                      danger
                                      separator
                                      onClick={() => annulerInvitation(membre, "Supprimer l'invitation")}
                                    >
                                      Supprimer l&apos;invitation
                                    </DropdownMenuButton>
                                  </>
                                ) : (
                                  <DropdownMenuButton
                                    icon="fr-icon-close-circle-line"
                                    danger
                                    onClick={() => annulerInvitation(membre, "Annuler l'invitation")}
                                  >
                                    Annuler l&apos;invitation
                                  </DropdownMenuButton>
                                )
                              }
                            </DropdownMenu>
                          </td>
                        </>
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
        <>
          <InvitationSidePanel
            isOpen={invitationOuverte}
            onClose={() => setInvitationOuverte(false)}
            onSuccess={(message) => {
              if (message) setRetour({ severity: "success", message });
              queryClient.invalidateQueries({ queryKey: cfaMembresQueryKey(organismeId) });
            }}
            endpoint={`/api/v1/admin/organismes/${organismeId}/membres/invitations`}
            submitLabel="Inviter ces utilisateurs"
            submitIconId="fr-icon-send-plane-fill"
          />
          <confirmationModal.Component
            title={confirmation?.titre ?? ""}
            buttons={[
              { children: "Annuler", doClosesModal: true, priority: "secondary" },
              {
                children: confirmation?.bouton ?? "Confirmer",
                doClosesModal: true,
                priority: "primary",
                onClick: () => {
                  if (confirmation) executer(confirmation.action, "L'action a échoué. Merci de réessayer.");
                },
              },
            ]}
          >
            <p>{confirmation?.texte}</p>
          </confirmationModal.Component>
        </>
      )}
    </div>
  );
}
