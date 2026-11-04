import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import type { ReactNode } from "react";
import { ANNUAIRE_ENTREPRISE, CATALOGUE_APPRENTISSAGE, REFERENTIEL_ONISEP } from "shared/constants/link";

import { NatureOrganismeTag } from "@/app/admin/_components/NatureOrganismeTag";

import type { ICfaFicheResponse } from "../../hooks/useStatsQueries";
import { CopyButton } from "../../ui/CopyButton";

import styles from "./FicheInfosTab.module.css";

const NON_RENSEIGNE = "-";

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.info}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const avecCopie = (value: string | null | undefined, title: string, content?: ReactNode) =>
  value ? (
    <span className={styles.valeur}>
      {content ?? value}
      <CopyButton value={value} title={title} />
    </span>
  ) : (
    NON_RENSEIGNE
  );

function SourceDonnees({ source }: { source: ICfaFicheResponse["source_donnees"] }) {
  const badges: ReactNode[] = [];
  if (source.deca) {
    badges.push(
      <Badge key="deca" as="span" severity="success" small>
        DECA
      </Badge>
    );
  }
  if (source.erps.length > 0) {
    badges.push(
      <Badge key="erp" as="span" severity={source.erreurs_transmission ? "warning" : "success"} small>
        {source.erreurs_transmission
          ? "ERP connecté - erreurs de transmission"
          : "ERP connecté pas d'erreur de transmission"}
      </Badge>
    );
  }
  if (source.fichier) {
    badges.push(
      <Badge key="fichier" as="span" severity="info" small>
        Dépôt de fichier
      </Badge>
    );
  }
  return badges.length ? <span className={styles.badges}>{badges}</span> : <>Aucune source de données</>;
}

const ficheCatalogue = (siret: string) =>
  `${new URL(CATALOGUE_APPRENTISSAGE).origin}/recherche/etablissements?SEARCH=%22${siret}%22`;
const ficheAnnuaire = (siret: string) => `${ANNUAIRE_ENTREPRISE.replace(/\/$/, "")}/etablissement/${siret}`;

function ContactReferent({ contact }: { contact: NonNullable<ICfaFicheResponse["contact_referent"]> }) {
  const nom = [contact.prenom, contact.nom?.toUpperCase()].filter(Boolean).join(" ") || "Nom inconnu";
  return (
    <span className={styles.valeur}>
      {nom}
      {contact.fonction ? `, ${contact.fonction}` : ""}
      {contact.telephone && (
        <>
          {" · "}
          <a href={`tel:${contact.telephone}`} className={fr.cx("fr-link")}>
            {contact.telephone}
          </a>
        </>
      )}
      {contact.email && (
        <>
          {" "}
          <a href={`mailto:${contact.email}`} className={fr.cx("fr-link")}>
            {contact.email}
          </a>
          <CopyButton value={contact.email} title="Copier l'adresse courriel du contact" />
        </>
      )}
    </span>
  );
}

export function CfaInfosTab({ data }: { data: ICfaFicheResponse }) {
  const courriel = data.courriels_referentiel[0];

  return (
    <div>
      <h2 className={styles.titre}>Infos et coordonnées</h2>
      <dl className={styles.grille}>
        <Info label="Source de données">
          <SourceDonnees source={data.source_donnees} />
        </Info>
        <div className={styles.ligne}>
          <Info label="UAI">{avecCopie(data.uai, "Copier l'UAI")}</Info>
          <Info label="SIRET">
            <span className={styles.valeur}>
              {data.siret}
              <CopyButton value={data.siret} title="Copier le SIRET" />
              <Badge as="span" severity={data.ferme ? "error" : "success"} small>
                {data.ferme ? "SIRET fermé" : "SIRET en activité"}
              </Badge>
            </span>
          </Info>
          <Info label="Nature établissement">
            <NatureOrganismeTag
              nature={(data.nature ?? "inconnue") as Parameters<typeof NatureOrganismeTag>[0]["nature"]}
            />
          </Info>
        </div>
        <Info label="Raison sociale">{data.raison_sociale ?? NON_RENSEIGNE}</Info>
        {data.peut_voir_nominatif && (
          <div className={styles.ligne}>
            <Info label="Adresse courriel générique">
              {avecCopie(
                courriel,
                "Copier l'adresse courriel",
                courriel && (
                  <a href={`mailto:${courriel}`} className={fr.cx("fr-link")}>
                    {courriel}
                  </a>
                )
              )}
            </Info>
            <Info label="N° de téléphone générique">{NON_RENSEIGNE}</Info>
          </div>
        )}
        <Info label="Adresse">
          {data.adresse.complete ||
            [data.adresse.code_postal, data.adresse.commune].filter(Boolean).join(" ") ||
            NON_RENSEIGNE}
        </Info>
        {data.peut_voir_nominatif && (
          <Info label="Contact référent identifié">
            {data.contact_referent ? (
              <ContactReferent contact={data.contact_referent} />
            ) : (
              "Aucun compte Tableau de bord créé à ce jour"
            )}
          </Info>
        )}
        <Info label="Site internet">{NON_RENSEIGNE}</Info>
        <Info label="Voir l'établissement sur">
          <span className={styles.liens}>
            <a href={ficheCatalogue(data.siret)} target="_blank" rel="noopener noreferrer" className={fr.cx("fr-link")}>
              Catalogue
            </a>
            <a
              href={`${REFERENTIEL_ONISEP}?text=${data.siret}`}
              target="_blank"
              rel="noopener noreferrer"
              className={fr.cx("fr-link")}
            >
              Référentiel
            </a>
            <a href={ficheAnnuaire(data.siret)} target="_blank" rel="noopener noreferrer" className={fr.cx("fr-link")}>
              Annuaire des entreprises
            </a>
          </span>
        </Info>
      </dl>
    </div>
  );
}
