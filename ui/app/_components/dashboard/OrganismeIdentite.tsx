"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { useState } from "react";
import {
  ANNUAIRE_ENTREPRISE,
  CATALOGUE_APPRENTISSAGE,
  FAQ_REFERENCER_ETABLISSEMENT,
  REFERENTIEL_ONISEP,
  UAI_INCONNUE,
  UAI_INCONNUE_TAG_FORMAT,
} from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { NatureOrganismeTag } from "@/app/admin/_components/NatureOrganismeTag";
import { Organisme } from "@/common/internal/Organisme";
import { formatSiretSplittedWithDefaultValue } from "@/common/utils/stringUtils";

import styles from "./dashboard.module.scss";

const UAI_INCONNUE_TOOLTIP = `Votre UAI est ${UAI_INCONNUE}. Si votre Unité Administrative Immatriculée (UAI) est répertoriée comme « ${UAI_INCONNUE_TAG_FORMAT} » alors que votre organisme en possède une, veuillez la communiquer à referentiel-uai-siret@onisep.fr avec la fiche UAI, afin qu’elle soit mise à jour. L’absence de ce numéro bloque l’enregistrement des contrats d’apprentissage. Si votre organisme ne possède pas encore d’UAI, adressez-vous au rectorat de l’académie où se situe votre CFA.`;

const SIRET_FERME_TOOLTIP =
  "État du SIRET « fermé » : un établissement est affiché fermé suite à une cessation d’activité ou un déménagement. Aucun effectif en apprentissage ne devrait être transmis sur un établissement considéré fermé. Si votre établissement a déménagé et possède un nouveau SIRET, veuillez le signaler aux acteurs publics de l’apprentissage.";

const NATURE_INCONNUE_TOOLTIP =
  "Votre nature est inconnue : cela signifie que l’offre de formation n’est pas collectée ou mal référencée par le Carif-Oref. Adressez-vous auprès de votre Carif-Oref régional pour renseigner cette donnée. La modification de la nature d’un organisme impacte ses relations avec les autres organismes.";

const QUALIOPI_TOOLTIP =
  "La donnée « Certifié qualiopi » provient de la Liste Publique des Organismes de Formations. Si cette information est erronée, merci de leur signaler.";

interface OrganismeIdentiteProps {
  organisme: Organisme;
  contacts?: Array<{ prenom?: string; nom?: string; fonction?: string; telephone?: string; email?: string }>;
}

export function OrganismeIdentite({ organisme, contacts }: OrganismeIdentiteProps) {
  const [copied, setCopied] = useState<"uai" | "siret" | null>(null);

  const handleCopy = async (field: "uai" | "siret", value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const contact = contacts?.[0];

  return (
    <>
      <div className={styles.identifiantsRow}>
        <div>
          <span className={styles.identifiantLabel}>UAI</span>
          <span className={styles.identifiantValue}>
            {organisme.uai ? (
              <>
                {organisme.uai}
                <Button
                  priority="tertiary no outline"
                  size="small"
                  iconId={copied === "uai" ? "ri-check-line" : "ri-file-copy-line"}
                  title="Copier l'UAI"
                  onClick={() => handleCopy("uai", organisme.uai as string)}
                />
              </>
            ) : (
              <span className={styles.identifiantWarning}>
                <i className="fr-icon-warning-fill fr-icon--sm" aria-hidden="true" />
                {UAI_INCONNUE_TAG_FORMAT} <Tooltip kind="hover" title={UAI_INCONNUE_TOOLTIP} />
              </span>
            )}
          </span>
        </div>
        <div>
          <span className={styles.identifiantLabel}>SIRET</span>
          <span className={styles.identifiantValue}>
            {formatSiretSplittedWithDefaultValue(organisme.siret)}
            {organisme.siret && (
              <Button
                priority="tertiary no outline"
                size="small"
                iconId={copied === "siret" ? "ri-check-line" : "ri-file-copy-line"}
                title="Copier le SIRET"
                onClick={() => handleCopy("siret", organisme.siret)}
              />
            )}
          </span>
        </div>
      </div>

      <div className={styles.badgesRow}>
        <span>
          <NatureOrganismeTag nature={organisme.nature} />
          {(!organisme.nature || organisme.nature === "inconnue") && (
            <>
              {" "}
              <Tooltip kind="hover" title={NATURE_INCONNUE_TOOLTIP} />
            </>
          )}
        </span>
        <span>
          <Badge severity={organisme.ferme ? "error" : "success"} small>
            {organisme.ferme ? "SIRET fermé" : "SIRET en activité"}
          </Badge>
          {organisme.ferme && (
            <>
              {" "}
              <Tooltip kind="hover" title={SIRET_FERME_TOOLTIP} />
            </>
          )}
        </span>
        <span>
          <Badge severity={organisme.qualiopi ? "success" : "info"} noIcon={!organisme.qualiopi} small>
            {organisme.qualiopi ? "Certifié Qualiopi" : "Non certifié Qualiopi"}
          </Badge>{" "}
          <Tooltip kind="hover" title={QUALIOPI_TOOLTIP} />
        </span>
      </div>

      <hr className={styles.identityDivider} />

      <div className={styles.infoLignes}>
        <p className={styles.infoLigne}>
          <i className="fr-icon-building-line fr-icon--sm" aria-hidden="true" />
          <span>
            {organisme.raison_sociale || "Inconnue"} <span className={styles.infoMention}>(raison sociale)</span>
          </span>
        </p>
        <p className={styles.infoLigne}>
          <i className="ri-map-pin-2-line fr-icon--sm" aria-hidden="true" />
          <span>{organisme.adresse?.complete || "Domiciliation inconnue"}</span>
        </p>
        {organisme.reseaux && organisme.reseaux.length > 0 && (
          <p className={styles.infoLigne}>
            <i className="fr-icon-links-line fr-icon--sm" aria-hidden="true" />
            <span>
              {organisme.reseaux.length === 1 ? "Réseau" : "Réseaux"}&nbsp;: {organisme.reseaux.join(", ")}
            </span>
          </p>
        )}
        {contacts && (
          <p className={styles.infoLigne}>
            <i className="fr-icon-user-line fr-icon--sm" aria-hidden="true" />
            {contact ? (
              <span>
                {contact.prenom} {contact.nom?.toUpperCase()}
                {contact.fonction ? `, ${contact.fonction}` : ""}
                {contact.telephone ? ` · ${contact.telephone}` : ""}
                {contact.email && (
                  <>
                    {" · "}
                    <DsfrLink href={`mailto:${contact.email}`} arrow="none" external>
                      Envoyer un courriel
                    </DsfrLink>
                  </>
                )}
              </span>
            ) : (
              <span>Responsable inconnu - Compte tableau de bord non créé à ce jour</span>
            )}
          </p>
        )}
      </div>

      <hr className={styles.identityDivider} />

      <p className={`${styles.infoMention} fr-mb-1v`}>Voir l&apos;établissement sur&nbsp;:</p>
      <div className={styles.externalLinks}>
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
          <DsfrLink href={`${ANNUAIRE_ENTREPRISE}/etablissement/${organisme.siret}`} arrow="none" size="sm" external>
            Annuaire des entreprises
          </DsfrLink>
        )}
      </div>

      {!organisme.fiabilisation_statut || organisme.fiabilisation_statut === "FIABLE" ? null : (
        <p className="fr-mt-2w fr-mb-0 fr-text--sm">
          <DsfrLink href={FAQ_REFERENCER_ETABLISSEMENT} arrow="right" size="sm" external>
            Comment bien référencer un établissement&nbsp;?
          </DsfrLink>
        </p>
      )}
    </>
  );
}
