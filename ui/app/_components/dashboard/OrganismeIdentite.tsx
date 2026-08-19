"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import {
  ANNUAIRE_ENTREPRISE,
  CATALOGUE_APPRENTISSAGE,
  FAQ_REFERENCER_ETABLISSEMENT,
  IOrganisationCreate,
  LIST_PUBIC_ORGANISMES_DE_FORMATIONS,
  natureOrganismeDeFormationLabel,
  REFERENTIEL_ONISEP,
  UAI_INCONNUE,
  UAI_INCONNUE_TAG_FORMAT,
} from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { InfoTransmissionDonnees } from "@/app/_components/organismes/InfoTransmissionDonnees";
import { _post } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatSiretSplittedWithDefaultValue } from "@/common/utils/stringUtils";

import styles from "./dashboard.module.scss";
import { AlertDuplicatsTag, InfoFiabilisationTag, InfoTransmissionDecaTag } from "./OrganismeStatusTags";

const UAI_INCONNUE_TOOLTIP = `Votre UAI est ${UAI_INCONNUE}. Si votre Unité Administrative Immatriculée (UAI) est répertoriée comme « ${UAI_INCONNUE_TAG_FORMAT} » alors que votre organisme en possède une, veuillez la communiquer à referentiel-uai-siret@onisep.fr avec la fiche UAI, afin qu’elle soit mise à jour. L’absence de ce numéro bloque l’enregistrement des contrats d’apprentissage. Si votre organisme ne possède pas encore d’UAI, adressez-vous au rectorat de l’académie où se situe votre CFA.`;

const SIRET_FERME_TOOLTIP =
  "État du SIRET « fermé » : un établissement est affiché fermé suite à une cessation d’activité ou un déménagement. Aucun effectif en apprentissage ne devrait être transmis sur un établissement considéré fermé. Si votre établissement a déménagé et possède un nouveau SIRET, veuillez le signaler aux acteurs publics de l’apprentissage.";

const NATURE_INCONNUE_TOOLTIP =
  "Votre nature est inconnue : cela signifie que l’offre de formation n’est pas collectée ou mal référencée par le Carif-Oref. Adressez-vous auprès de votre Carif-Oref régional pour renseigner cette donnée. La modification de la nature d’un organisme impacte ses relations avec les autres organismes.";

const QUALIOPI_TOOLTIP = `La donnée « Certifié qualiopi » provient de la Liste Publique des Organismes de Formations (${LIST_PUBIC_ORGANISMES_DE_FORMATIONS}). Si cette information est erronée, merci de leur signaler.`;

interface OrganismeIdentiteProps {
  organisme: Organisme;
  modePublique: boolean;
  organisationType?: string;
  indicateursEffectifs?: any;
  duplicatesCount: number;
}

export function OrganismeIdentite({
  organisme,
  modePublique,
  organisationType,
  indicateursEffectifs,
  duplicatesCount,
}: OrganismeIdentiteProps) {
  const natureLabel = natureOrganismeDeFormationLabel[organisme.nature] || "Inconnue";

  return (
    <>
      <div className={styles.badgesRow}>
        {organisme.permissions?.infoTransmissionEffectifs && (
          <InfoTransmissionDonnees
            modeBadge
            lastTransmissionDate={organisme.last_transmission_date}
            permissionInfoTransmissionEffectifs={organisme.permissions?.infoTransmissionEffectifs}
          />
        )}
        {!organisme.is_transmission_target && (
          <InfoTransmissionDecaTag
            date={organisme.last_effectifs_deca_update ? new Date(organisme.last_effectifs_deca_update) : undefined}
            indicateursEffectifs={indicateursEffectifs}
          />
        )}
        {organisme.fiabilisation_statut && (
          <InfoFiabilisationTag fiabilisationStatut={organisme.fiabilisation_statut} />
        )}
        {duplicatesCount > 0 && <AlertDuplicatsTag />}
        {organisationType === "ADMINISTRATEUR" && (
          <Button
            priority="secondary"
            size="small"
            onClick={async () => {
              await _post<IOrganisationCreate>("/api/v1/admin/impersonate", {
                type: "ORGANISME_FORMATION",
                siret: organisme.siret,
                uai: organisme.uai ?? null,
              });
              location.href = "/";
            }}
          >
            Imposture
          </Button>
        )}
      </div>

      <dl className={styles.identityList}>
        <div className={styles.identityRow}>
          <dt className={styles.identityLabel}>UAI&nbsp;:</dt>
          <dd className={styles.identityTag}>
            {organisme.uai ? (
              organisme.uai
            ) : (
              <span className={styles.identityTagWarning}>
                <i className="fr-icon-warning-fill fr-icon--sm" aria-hidden="true" />
                {UAI_INCONNUE_TAG_FORMAT} <Tooltip kind="hover" title={UAI_INCONNUE_TOOLTIP} />
              </span>
            )}
          </dd>

          <dt className={styles.identityLabel}>SIRET&nbsp;:</dt>
          <dd className={styles.identityTag}>
            {formatSiretSplittedWithDefaultValue(organisme.siret)} ({organisme.ferme ? "fermé" : "en activité"})
            {organisme.ferme && (
              <>
                {" "}
                <Tooltip kind="hover" title={SIRET_FERME_TOOLTIP} />
              </>
            )}
          </dd>

          <dt className={styles.identityLabel}>Nature&nbsp;:</dt>
          <dd className={styles.identityTag}>
            {natureLabel}
            {natureLabel === "Inconnue" && (
              <>
                {" "}
                <Tooltip kind="hover" title={NATURE_INCONNUE_TOOLTIP} />
              </>
            )}
          </dd>

          {modePublique && (
            <>
              <dt className={styles.identityLabel}>Certifié Qualiopi&nbsp;:</dt>
              <dd className={styles.identityTag}>
                {organisme.qualiopi ? "Oui" : "Non"} <Tooltip kind="hover" title={QUALIOPI_TOOLTIP} />
              </dd>
            </>
          )}
        </div>

        {organisme.reseaux && organisme.reseaux.length > 0 && (
          <div className={styles.identityRow}>
            <dt className={styles.identityLabel}>
              Cet organisme fait partie {organisme.reseaux.length === 1 ? "du réseau" : "des réseaux"}&nbsp;:
            </dt>
            {organisme.reseaux.map((reseau) => (
              <dd key={reseau} className={styles.identityTag}>
                {reseau}
              </dd>
            ))}
          </div>
        )}

        <div className={styles.identityRow}>
          <dt className={styles.identityLabel}>Raison sociale&nbsp;:</dt>
          <dd className={styles.identityValue}>{organisme.raison_sociale || "Inconnue"}</dd>
        </div>

        <div className={styles.identityRow}>
          <dt className={styles.identityLabel}>Domiciliation&nbsp;:</dt>
          <dd className={styles.identityValue}>{organisme.adresse?.complete || "Inconnue"}</dd>
        </div>

        <div className={styles.identityRow}>
          <dt className={styles.identityLabel}>Voir l&apos;établissement sur&nbsp;:</dt>
          <dd className={styles.externalLinks}>
            <DsfrLink
              href={`${CATALOGUE_APPRENTISSAGE}/recherche/etablissements?SEARCH=%22${organisme.siret}%22`}
              arrow="none"
              size="sm"
              external
            >
              Catalogue
            </DsfrLink>
            <DsfrLink href={`${REFERENTIEL_ONISEP}?text=${organisme.siret}`} arrow="none" size="sm" external>
              Référentiel
            </DsfrLink>
            {organisme.siret && (
              <DsfrLink
                href={`${ANNUAIRE_ENTREPRISE}/etablissement/${organisme.siret}`}
                arrow="none"
                size="sm"
                external
              >
                Annuaire des entreprises
              </DsfrLink>
            )}
          </dd>
        </div>
      </dl>

      {!organisme.fiabilisation_statut || organisme.fiabilisation_statut === "FIABLE" ? null : (
        <p className="fr-mt-2w fr-text--sm">
          <DsfrLink href={FAQ_REFERENCER_ETABLISSEMENT} arrow="right" size="sm" external>
            Comment bien référencer un établissement&nbsp;?
          </DsfrLink>
        </p>
      )}
    </>
  );
}
