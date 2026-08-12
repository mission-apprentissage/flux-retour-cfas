"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Fragment, useCallback, useMemo, useState } from "react";
import { IndicateursEffectifsAvecFormation } from "shared";

import { niveauFormationByNiveau } from "@/modules/indicateurs/filters/niveauxFormation";
import { CertificationDetails } from "@/modules/organismes/CertificationDetails/CertificationDetails";

import styles from "./effectifs-par-formation.module.scss";

const certificationModal = createModal({ id: "dashboard-certification-details", isOpenedByDefault: false });

interface NiveauAvecFormations {
  id: string;
  niveau: string | null;
  label: string;
  formations: IndicateursEffectifsAvecFormation[];
}

export function EffectifsParFormationTable({ formations }: { formations: IndicateursEffectifsAvecFormation[] }) {
  const [selectedFormation, setSelectedFormation] = useState<IndicateursEffectifsAvecFormation | null>(null);
  const [expandedNiveaux, setExpandedNiveaux] = useState<Record<string, boolean>>({});

  const niveauxAvecFormations: NiveauAvecFormations[] = useMemo(() => {
    const groupedByNiveau = formations.reduce<Map<string | null, NiveauAvecFormations>>((acc, formation) => {
      if (!acc.has(formation.niveau_europeen)) {
        acc.set(formation.niveau_europeen, {
          id: formation.niveau_europeen ?? "",
          niveau: formation.niveau_europeen,
          label: niveauFormationByNiveau[formation.niveau_europeen ?? ""] ?? "Niveau inconnu",
          formations: [],
        });
      }
      acc.get(formation.niveau_europeen)!.formations.push(formation);
      return acc;
    }, new Map());

    return Array.from(groupedByNiveau.values()).sort((a, b) => {
      if (a.niveau === null) return 1;
      if (b.niveau === null) return -1;
      return a.niveau.localeCompare(b.niveau);
    });
  }, [formations]);

  const toggleExpand = useCallback((niveauId: string) => {
    setExpandedNiveaux((current) => ({ ...current, [niveauId]: !current[niveauId] }));
  }, []);

  const openCertification = (formation: IndicateursEffectifsAvecFormation) => {
    setSelectedFormation(formation);
    certificationModal.open();
  };

  return (
    <>
      <div className="fr-table fr-table--bordered">
        <table>
          <thead>
            <tr>
              <th scope="col">Niveau et intitulé de la formation</th>
              <th scope="col">Apprentis</th>
              <th scope="col">Sans contrat</th>
              <th scope="col">Ruptures</th>
              <th scope="col">Sorties</th>
            </tr>
          </thead>
          <tbody>
            {niveauxAvecFormations.map((niveauAvecFormations) => {
              const isExpanded = Boolean(expandedNiveaux[niveauAvecFormations.id]);
              return (
                <Fragment key={niveauAvecFormations.id}>
                  <tr className={styles.niveauRow}>
                    <td colSpan={5}>
                      <button
                        type="button"
                        className={styles.niveauToggle}
                        aria-expanded={isExpanded}
                        onClick={() => toggleExpand(niveauAvecFormations.id)}
                      >
                        <i
                          className={`${isExpanded ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"} fr-icon--sm`}
                          aria-hidden="true"
                        />
                        {niveauAvecFormations.label}
                      </button>
                    </td>
                  </tr>

                  {isExpanded &&
                    niveauAvecFormations.formations.map((formation) => (
                      <tr key={`${niveauAvecFormations.id}-${formation.rncp_code}-${formation.cfd_code}`}>
                        <td>
                          {formation.intitule ? (
                            <button
                              type="button"
                              className={styles.formationLink}
                              title={formation.intitule}
                              onClick={() => openCertification(formation)}
                            >
                              {formation.intitule}
                            </button>
                          ) : (
                            <span>Certification non trouvée</span>
                          )}
                          <span className={styles.formationCodes}>
                            RNCP&nbsp;: {formation.rncp_code ?? <span className={styles.codeInconnu}>INCONNU</span>}
                            {" / "}
                            CFD&nbsp;: {formation.cfd_code ?? <span className={styles.codeInconnu}>INCONNU</span>}
                          </span>
                        </td>
                        <td>{formation.apprentis}</td>
                        <td>{formation.inscrits}</td>
                        <td>{formation.rupturants}</td>
                        <td>{formation.abandons}</td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <certificationModal.Component
        title={selectedFormation?.intitule ?? selectedFormation?.rncp_code ?? "Détail de la certification"}
        size="large"
      >
        {selectedFormation && (
          <CertificationDetails rncp_code={selectedFormation.rncp_code} cfd_code={selectedFormation.cfd_code} />
        )}
      </certificationModal.Component>
    </>
  );
}
