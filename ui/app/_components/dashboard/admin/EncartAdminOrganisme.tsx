"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { UAI_INCONNUE } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";

import { CollabV2AdminSection } from "./CollabV2AdminSection";
import { DecaCfaPilotAdminSection } from "./DecaCfaPilotAdminSection";
import styles from "./encart-admin.module.scss";
import { InviteCfaAdminModal, inviteCfaAdminModal } from "./InviteCfaAdminModal";

interface ParametrageTransmission {
  transmission_date?: string;
  transmission_api_active: boolean;
  transmission_api_version?: string;
  transmission_manuelle_active: boolean;
  parametrage_erp_active: boolean;
  api_key_active: boolean;
  api_key?: string;
  api_key_revoked_at?: string;
  api_key_revoked_reason?: string;
  parametrage_erp_date?: string;
  parametrage_erp_author?: string;
  erps?: string[];
  erp_unsupported?: string;
  organisme_transmetteur?: {
    _id: string;
    enseigne?: string;
    raison_sociale?: string;
    uai: string;
    siret: string;
  };
}

interface InvitationCounts {
  organisation_id: string | null;
  usersTotal: number;
  usersAdmin: number;
  invitationsPending: number;
}

export function EncartAdminOrganisme({ organisme }: { organisme: Organisme }) {
  const [showFullApiKey, setShowFullApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  const { data: parametrage } = useQuery<ParametrageTransmission>({
    queryKey: ["admin/organismes/parametrage-transmission", organisme._id],
    queryFn: () => _get(`/api/v1/admin/organismes/${organisme._id}/parametrage-transmission`),
    enabled: !!organisme._id,
  });

  const { data: counts, refetch: refetchCounts } = useQuery<InvitationCounts>({
    queryKey: ["admin/invitations/counts/organisme", organisme._id],
    queryFn: () => _get(`/api/v1/admin/invitations/counts/organisme/${organisme._id}`),
    enabled: !!organisme._id,
  });

  const canInviteAdmin = Boolean(organisme.siret);
  const normalizedUai =
    organisme.uai && organisme.uai.toLowerCase() !== UAI_INCONNUE.toLowerCase() ? organisme.uai : null;
  const organismeNom = organisme.enseigne || organisme.raison_sociale || organisme.nom || "Organisme";

  const apiKeyDisplay = parametrage?.api_key
    ? showFullApiKey
      ? parametrage.api_key
      : parametrage.api_key.replace(/(?<=.{3})./g, "*")
    : "Aucune clé API disponible";

  const handleCopy = async () => {
    if (!parametrage?.api_key) return;
    await navigator.clipboard.writeText(parametrage.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={styles.encart}>
      <p className={styles.sectionTitle}>
        <i className="ri-eye-fill" aria-hidden="true" />
        Encart réservé aux administrateurs
      </p>

      <div className={styles.encartGrid}>
        <div className={styles.encartCell}>
          <p className={styles.sectionTitle}>
            <i className="ri-send-plane-line" aria-hidden="true" />
            Transmission
          </p>

          <div className={styles.blocksColumn}>
            <div>
              <span className={styles.blockLabel}>État</span>
              <span className={styles.blockValue}>
                {parametrage?.transmission_date &&
                (parametrage?.transmission_api_active || parametrage?.transmission_manuelle_active) ? (
                  <>
                    <Badge severity="success" small>
                      Active
                    </Badge>
                    {(parametrage.transmission_api_version || (parametrage.erps?.length ?? 0) > 0) && (
                      <span className={styles.tagInfo}>
                        {`${parametrage.erps?.map((erp) => erp.toUpperCase()).join(", ")} ${parametrage.transmission_api_version || ""}`}
                      </span>
                    )}
                    <span className={styles.muted}>
                      dernière le {new Date(parametrage.transmission_date).toLocaleDateString()}
                    </span>
                  </>
                ) : (
                  <Badge severity="error" noIcon small>
                    Aucune
                  </Badge>
                )}
                {organisme.has_transmission_errors && (
                  <Badge severity="warning" small>
                    {organisme.transmission_errors_date
                      ? `Erreurs détectées le ${new Date(organisme.transmission_errors_date).toLocaleDateString()}`
                      : "Erreurs détectées"}
                  </Badge>
                )}
              </span>
            </div>

            <div>
              <span className={styles.blockLabel}>Clé API</span>
              <span className={styles.blockValue}>
                {parametrage?.api_key ? (
                  <>
                    <input className={`fr-input ${styles.apiKeyInput}`} value={apiKeyDisplay} readOnly />
                    <Button
                      priority="secondary"
                      size="small"
                      iconId={showFullApiKey ? "ri-eye-off-line" : "ri-eye-line"}
                      title={showFullApiKey ? "Masquer la clé API" : "Afficher la clé API"}
                      onClick={() => setShowFullApiKey(!showFullApiKey)}
                    />
                    <Button priority="secondary" size="small" onClick={handleCopy}>
                      {copied ? "Copié !" : "Copier"}
                    </Button>
                  </>
                ) : parametrage?.api_key_revoked_at ? (
                  <Badge severity="error" small>
                    Clé expirée le {new Date(parametrage.api_key_revoked_at).toLocaleDateString()} (inactivité)
                  </Badge>
                ) : (
                  <Badge noIcon small>
                    Aucune clé API
                  </Badge>
                )}
              </span>
            </div>

            <div>
              <span className={styles.blockLabel}>Paramétrage ERP</span>
              <span className={styles.blockValue}>
                {parametrage?.parametrage_erp_active || parametrage?.erp_unsupported ? (
                  <>
                    <span className={styles.tagInfo}>
                      {`${parametrage.erps?.map((erp) => erp.toUpperCase()).join(", ")} ${
                        parametrage.erp_unsupported ? `${parametrage.erp_unsupported.toUpperCase()} ` : ""
                      }${
                        parametrage.parametrage_erp_date
                          ? new Date(parametrage.parametrage_erp_date).toLocaleDateString()
                          : ""
                      }`}
                    </span>
                    {parametrage.parametrage_erp_author && (
                      <span className={styles.muted}>par {parametrage.parametrage_erp_author}</span>
                    )}
                  </>
                ) : (
                  <Badge noIcon small>
                    Non configuré
                  </Badge>
                )}
              </span>
            </div>

            {parametrage?.organisme_transmetteur && (
              <div>
                <span className={styles.blockLabel}>Dernier organisme transmetteur</span>
                <span className={styles.blockValue}>
                  <DsfrLink href={`/organismes/${parametrage.organisme_transmetteur._id}`} arrow="none" external>
                    {parametrage.organisme_transmetteur.enseigne ??
                      parametrage.organisme_transmetteur.raison_sociale ??
                      "Organisme inconnu"}{" "}
                    (UAI&nbsp;: {parametrage.organisme_transmetteur.uai} - SIRET&nbsp;:{" "}
                    {parametrage.organisme_transmetteur.siret})
                  </DsfrLink>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.encartCell}>
          <p className={styles.sectionTitle}>
            <i className="ri-user-add-line" aria-hidden="true" />
            Gestion des administrateurs
          </p>

          <div className={styles.row}>
            <Button
              priority="secondary"
              iconId="ri-mail-send-line"
              disabled={!canInviteAdmin}
              title={canInviteAdmin ? undefined : "Cet organisme n'a pas de SIRET, invitation impossible"}
              onClick={() => {
                setInviteFeedback(null);
                inviteCfaAdminModal.open();
              }}
            >
              Inviter un administrateur
            </Button>
          </div>

          {inviteFeedback && (
            <Alert
              severity="success"
              small
              closable
              onClose={() => setInviteFeedback(null)}
              description={inviteFeedback}
            />
          )}

          {counts?.organisation_id && (
            <div className={styles.links}>
              <DsfrLink
                href={`/admin/users?tab=users&organisation_id=${counts.organisation_id}`}
                arrow="right"
                external={false}
              >
                Voir les {counts.usersTotal} utilisateur{counts.usersTotal > 1 ? "s" : ""} actif
                {counts.usersTotal > 1 ? "s" : ""}
                {counts.usersAdmin > 0 ? ` (dont ${counts.usersAdmin} admin)` : ""}
              </DsfrLink>
              <DsfrLink
                href={`/admin/users?tab=invitations-pending&organisation_id=${counts.organisation_id}`}
                arrow="right"
                external={false}
              >
                Voir les {counts.invitationsPending} invitation{counts.invitationsPending > 1 ? "s" : ""} en cours
              </DsfrLink>
            </div>
          )}
        </div>

        <div className={styles.encartCell}>
          <DecaCfaPilotAdminSection organisme={organisme} />
        </div>

        <div className={styles.encartCell}>
          <CollabV2AdminSection organisme={organisme} />
        </div>
      </div>

      {canInviteAdmin && (
        <InviteCfaAdminModal
          siret={organisme.siret}
          uai={normalizedUai}
          organismeNom={organismeNom}
          onSuccess={(message) => {
            setInviteFeedback(message);
            refetchCounts();
          }}
        />
      )}
    </section>
  );
}
