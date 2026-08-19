"use client";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useQuery } from "@tanstack/react-query";
import { Statut, getStatut } from "shared";

import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { _get, _put } from "@/common/httpClient";
import { prettyPrintDate } from "@/common/utils/dateUtils";

import styles from "./effectif-detail.module.scss";
import { EffectifFieldList } from "./EffectifFieldList";
import { buildFieldViews, getRawValue } from "./effectifFields";

const APPRENANT_IDENTITE = [
  "apprenant.ine",
  "apprenant.sexe",
  "apprenant.nom",
  "apprenant.prenom",
  "apprenant.date_de_naissance",
  "apprenant.adresse_naissance.code_postal",
  "apprenant.nationalite",
  "apprenant.rqth",
  "apprenant.date_rqth",
  "apprenant.inscription_sportif_haut_niveau",
  "apprenant.courriel",
  "apprenant.telephone",
  "apprenant.mineur_emancipe",
];

const REPRESENTANT_LEGAL = [
  "apprenant.representant_legal.nom",
  "apprenant.representant_legal.prenom",
  "apprenant.representant_legal.pcs",
  "apprenant.representant_legal.courriel",
  "apprenant.representant_legal.telephone",
  "apprenant.representant_legal.meme_adresse",
];

const REPRESENTANT_LEGAL_ADRESSE = [
  "apprenant.representant_legal.adresse.numero",
  "apprenant.representant_legal.adresse.repetition_voie",
  "apprenant.representant_legal.adresse.voie",
  "apprenant.representant_legal.adresse.complement",
  "apprenant.representant_legal.adresse.code_postal",
  "apprenant.representant_legal.adresse.commune",
];

const APPRENANT_ADRESSE = [
  "apprenant.adresse.numero",
  "apprenant.adresse.repetition_voie",
  "apprenant.adresse.voie",
  "apprenant.adresse.complement",
  "apprenant.adresse.code_postal",
  "apprenant.adresse.code_insee",
  "apprenant.adresse.commune",
];

const APPRENANT_PARCOURS = [
  "apprenant.situation_avant_contrat",
  "apprenant.type_cfa",
  "apprenant.dernier_organisme_uai",
  "apprenant.derniere_situation",
  "apprenant.dernier_diplome",
  "apprenant.regime_scolaire",
];

const FORMATION = [
  "formation.rncp",
  "formation.cfd",
  "formation.duree_theorique_mois",
  "formation.duree_formation_relle",
  "formation.annee",
  "formation.date_inscription",
  "formation.date_entree",
  "formation.date_fin",
  "formation.date_obtention_diplome",
  "lieu_de_formation.adresse",
  "lieu_de_formation.code_postal",
];

const contratFields = (index: number) => [
  `contrats[${index}].date_debut`,
  `contrats[${index}].date_fin`,
  `contrats[${index}].date_rupture`,
  `contrats[${index}].siret`,
  `contrats[${index}].denomination`,
  `contrats[${index}].naf`,
  `contrats[${index}].nombre_de_salaries`,
  `contrats[${index}].type_employeur`,
];

const contratAdresseFields = (index: number) => [
  `contrats[${index}].adresse.numero`,
  `contrats[${index}].adresse.repetition_voie`,
  `contrats[${index}].adresse.voie`,
  `contrats[${index}].adresse.complement`,
  `contrats[${index}].adresse.code_postal`,
  `contrats[${index}].adresse.commune`,
  `contrats[${index}].adresse.departement`,
  `contrats[${index}].adresse.region`,
];

interface EffectifDetailProps {
  effectifId: string;
  organismeId: string;
  parcours: Statut["parcours"];
  transmissionDate: Date | null;
  validationErrors: any[];
}

function AccordionLabel({ title, errorCount }: { title: string; errorCount: number }) {
  return (
    <span className={styles.accordionTitle}>
      {title}
      {errorCount > 0 && (
        <span className={styles.errorCount}>
          <i className="fr-icon-error-fill fr-icon--sm" aria-hidden="true" /> {errorCount}
        </span>
      )}
    </span>
  );
}

export function EffectifDetail({
  effectifId,
  organismeId,
  parcours,
  transmissionDate,
  validationErrors,
}: EffectifDetailProps) {
  const { data: effectif, isLoading } = useQuery({
    queryKey: ["effectif", effectifId],
    queryFn: () => _get(`/api/v1/effectif/${effectifId}`),
  });

  if (isLoading || !effectif) {
    return <TableSkeleton />;
  }

  const errorsFor = (predicate: (fieldName: string) => boolean) =>
    validationErrors.filter((error) => predicate(error.fieldName));

  const statutErrors = errorsFor((name) => name.includes("apprenant.historique_statut"));
  const formationErrors = errorsFor((name) => name.includes("formation.") || name.includes("lieu_de_formation"));
  const contratsErrors = errorsFor((name) => name.includes("contrats"));
  const apprenantErrors = validationErrors.filter(
    (error) => !statutErrors.includes(error) && !formationErrors.includes(error) && !contratsErrors.includes(error)
  );

  const now = new Date();
  const pastStatuses = [...parcours]
    .filter((statut) => new Date(statut.date) <= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const currentStatus = pastStatuses.at(-1);
  const historyStatus = pastStatuses.slice(0, -1).reverse();

  const showRepresentantLegal =
    getRawValue(effectif, "apprenant.mineur_emancipe") === false ||
    !!getRawValue(effectif, "apprenant.representant_legal.courriel") ||
    !!getRawValue(effectif, "apprenant.representant_legal.telephone");
  const showRepresentantLegalAdresse =
    showRepresentantLegal && getRawValue(effectif, "apprenant.representant_legal.meme_adresse") === false;

  const adresseComplete = getRawValue(effectif, "apprenant.adresse.complete");
  const typeCfa = getRawValue(effectif, "apprenant.type_cfa");

  const contrats: any[] = effectif.contrats?.value ?? [];

  return (
    <div className={styles.detail}>
      <p className={styles.transmissionDate}>
        Date de dernière mise à jour : {transmissionDate ? prettyPrintDate(transmissionDate) : "plus de 2 semaines"}
      </p>

      <Accordion label={<AccordionLabel title="Statuts" errorCount={statutErrors.length} />}>
        {currentStatus ? (
          <>
            <div className={styles.statutRow}>
              <span>Statut actuel</span>
              <span className={styles.statutValue}>{getStatut(currentStatus.valeur)}</span>
            </div>
            <div className={styles.statutRow}>
              <span>Date de déclaration du statut</span>
              <span className={styles.statutValue}>{new Date(currentStatus.date).toLocaleDateString()}</span>
            </div>
            <p className={styles.statutHistoriqueTitle}>Anciens statuts</p>
            {historyStatus.length > 0 ? (
              <ul>
                {historyStatus.map((statut, index) => (
                  <li key={index}>
                    <strong>{getStatut(statut.valeur)}</strong> déclaré le {new Date(statut.date).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyBlock}>Aucun ancien statut</p>
            )}
          </>
        ) : (
          <div className={styles.statutRow}>
            <span>Statut actuel</span>
            <span className={styles.statutValue}>Aucun statut</span>
          </div>
        )}
      </Accordion>

      <Accordion label={<AccordionLabel title="Apprenant" errorCount={apprenantErrors.length} />}>
        <div className={styles.columns}>
          <div>
            <EffectifFieldList
              title="Identité"
              fields={buildFieldViews(effectif, APPRENANT_IDENTITE, validationErrors)}
            />
            {showRepresentantLegal && (
              <>
                <EffectifFieldList
                  title="Représentant légal"
                  fields={buildFieldViews(effectif, REPRESENTANT_LEGAL, validationErrors)}
                />
                {showRepresentantLegalAdresse && (
                  <EffectifFieldList
                    title="Adresse du représentant légal"
                    fields={buildFieldViews(effectif, REPRESENTANT_LEGAL_ADRESSE, validationErrors)}
                  />
                )}
              </>
            )}
          </div>
          <div>
            <p className={styles.blockTitle}>Adresse de l&apos;apprenant(e)</p>
            {adresseComplete && (
              <p className={styles.adresseErp}>
                <strong>Information ERP/API :</strong> {adresseComplete}
              </p>
            )}
            <EffectifFieldList fields={buildFieldViews(effectif, APPRENANT_ADRESSE, validationErrors)} />
            <EffectifFieldList
              title="Parcours et situation"
              fields={buildFieldViews(effectif, APPRENANT_PARCOURS, validationErrors)}
            />
            {typeCfa && (
              <div className={styles.applyAll}>
                <Button
                  priority="secondary"
                  size="small"
                  onClick={async () => {
                    if (confirm("Êtes-vous sûr de vouloir appliquer ce paramètre à tous les effectifs ?")) {
                      await _put(`/api/v1/organismes/${organismeId}/effectifs`, {
                        "apprenant.type_cfa": typeCfa,
                      });
                    }
                  }}
                >
                  Appliquer le type de CFA à tous les effectifs
                </Button>
              </div>
            )}
          </div>
        </div>
      </Accordion>

      <Accordion label={<AccordionLabel title="Formation" errorCount={formationErrors.length} />}>
        <div className={styles.columns}>
          <EffectifFieldList
            title="Formation suivie"
            fields={buildFieldViews(effectif, FORMATION.slice(0, 6), validationErrors)}
          />
          <EffectifFieldList
            title="Dates et lieu"
            fields={buildFieldViews(effectif, FORMATION.slice(6), validationErrors)}
          />
        </div>
      </Accordion>

      <Accordion label={<AccordionLabel title="Contrat(s)" errorCount={contratsErrors.length} />}>
        {contrats.length > 0 ? (
          contrats.map((_, index) => (
            <div key={index} className={styles.contratBlock}>
              <p className={styles.contratTitle}>Contrat {index + 1}</p>
              <div className={styles.columns}>
                <EffectifFieldList fields={buildFieldViews(effectif, contratFields(index), validationErrors)} />
                <EffectifFieldList
                  title="Adresse de l'employeur"
                  fields={buildFieldViews(effectif, contratAdresseFields(index), validationErrors)}
                />
              </div>
            </div>
          ))
        ) : (
          <p className={styles.emptyBlock}>Pas de contrat</p>
        )}
      </Accordion>
    </div>
  );
}
