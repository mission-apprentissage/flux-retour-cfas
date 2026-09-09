"use client";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { OrganismeSupportInfoJson, UAI_INCONNUE_TAG_FORMAT } from "shared";
import { OffreFormation } from "shared/models/data/@types/OffreFormation";
import { IRelatedOrganismeJson } from "shared/models/data/organismes.model";

import { FormationsTable } from "./FormationsTable";
import styles from "./related-organismes.module.scss";
import { SupportBadge } from "./SupportBadge";

type OrganismeIdentity = Pick<NonNullable<OrganismeSupportInfoJson["tdb"]>, "siret" | "uai">;

function isRelated(related: Pick<IRelatedOrganismeJson, "uai" | "siret">, formation: OffreFormation) {
  return (
    (related.siret === formation.formateur?.siret && related.uai === formation.formateur?.uai) ||
    (related.siret === formation.gestionnaire?.siret && related.uai === formation.gestionnaire?.uai)
  );
}

export function RelatedOrganismes({
  organisme,
  relatedOrganismes,
  formations,
  type,
}: {
  organisme: OrganismeIdentity;
  relatedOrganismes: IRelatedOrganismeJson[];
  formations: OffreFormation[];
  type: "responsables" | "formateurs";
}) {
  if (relatedOrganismes.length === 0) {
    return <p>Aucun organisme {type === "responsables" ? "responsable" : "formateur"} rattaché à cet organisme.</p>;
  }

  return (
    <div className={styles.list}>
      {relatedOrganismes.map((related) => {
        const relatedFormations = formations.filter((formation) => isRelated(related, formation));
        const nom = related.enseigne ?? related.raison_sociale ?? "Organisme inconnu";

        return (
          <Accordion
            key={String(related._id ?? related.siret)}
            label={`${nom} — ${relatedFormations.length} formation${relatedFormations.length > 1 ? "s" : ""}`}
          >
            <p className={styles.identity}>
              <span>UAI : {related.uai ?? <span className={styles.missingValue}>{UAI_INCONNUE_TAG_FORMAT}</span>}</span>
              <span>SIRET : {related.siret ?? "inconnu"}</span>
              {related.responsabilitePartielle && <SupportBadge level="warning" value="Responsable partiel" />}
            </p>

            {relatedFormations.length > 0 ? (
              <FormationsTable
                organisme={organisme}
                formations={relatedFormations}
                withNature={false}
                tableLabel={`Formations de ${nom}`}
              />
            ) : (
              <p>Aucune formation partagée avec cet organisme.</p>
            )}
          </Accordion>
        );
      })}
    </div>
  );
}
