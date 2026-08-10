"use client";

import { DEPARTEMENTS_SORTED, IOrganisationType, REGIONS_SORTED, UAI_INCONNUE_CAPITALIZE } from "shared";

import { useAuth } from "@/app/_context/UserContext";
import { OrganismesFilters } from "@/common/filters/organismes-filters";

import { FilterCheckboxMenu } from "./FilterCheckboxMenu";
import styles from "./organismes.module.scss";

export interface OrganismeFiltersListVisibilityProps {
  showFilterUai?: boolean;
  showFilterNature?: boolean;
  showFilterTransmission?: boolean;
  showFilterQualiopi?: boolean;
  showFilterLocalisation?: boolean;
  showFilterEtat?: boolean;
}

interface OrganismesFilterPanelProps extends OrganismeFiltersListVisibilityProps {
  filters: OrganismesFilters;
  onFiltersChange: (newParams: Partial<OrganismesFilters>) => void;
  onReset: () => void;
}

const isAllowedToShowFilterDepartement = (type?: IOrganisationType) =>
  type === "TETE_DE_RESEAU" || type === "DREETS" || type === "ACADEMIE" || type === "ADMINISTRATEUR";

const isAllowedToShowFilterRegions = (type?: IOrganisationType) =>
  type === "TETE_DE_RESEAU" || type === "ADMINISTRATEUR";

const isAllowedToShowFilterUAI = (type?: IOrganisationType) =>
  type === "TETE_DE_RESEAU" ||
  type === "DREETS" ||
  type === "ACADEMIE" ||
  type === "ADMINISTRATEUR" ||
  type === "ORGANISME_FORMATION";

const boolsToStrings = (values: boolean[]) => values.map((value) => value.toString());
const stringsToBools = (values: string[]) => values.map((value) => value === "true");

export function OrganismesFilterPanel(props: OrganismesFilterPanelProps) {
  const { user } = useAuth();
  const organisation = user?.organisation;
  const type = organisation?.type as IOrganisationType | undefined;

  const departements = DEPARTEMENTS_SORTED.filter((departement) => {
    if (type === "DREETS") return departement.region.code === (organisation as any)?.code_region;
    if (type === "ACADEMIE") return departement.academie.code === (organisation as any)?.code_academie;
    return true;
  });

  return (
    <div className={styles.filterPanel}>
      <p className={styles.filterPanelLabel}>FILTRER PAR</p>
      <div className={styles.filterPanelRow}>
        {props.showFilterLocalisation && isAllowedToShowFilterDepartement(type) && (
          <FilterCheckboxMenu
            buttonLabel="Département"
            options={departements.map((d) => ({ value: d.code, label: `${d.code} - ${d.nom}` }))}
            value={props.filters.departements}
            onChange={(departements) => props.onFiltersChange({ departements })}
          />
        )}

        {props.showFilterLocalisation && isAllowedToShowFilterRegions(type) && (
          <FilterCheckboxMenu
            buttonLabel="Région"
            options={REGIONS_SORTED.map((r) => ({ value: r.code, label: r.nom }))}
            value={props.filters.regions}
            onChange={(regions) => props.onFiltersChange({ regions })}
          />
        )}

        {props.showFilterNature && (
          <FilterCheckboxMenu
            buttonLabel="Nature"
            options={[
              { value: "responsable", label: "Responsable" },
              { value: "formateur", label: "Formateur" },
              { value: "responsable_formateur", label: "Responsable formateur" },
              { value: "inconnue", label: "Inconnue" },
            ]}
            value={props.filters.nature}
            onChange={(nature) => props.onFiltersChange({ nature })}
          />
        )}

        {props.showFilterUai && isAllowedToShowFilterUAI(type) && (
          <FilterCheckboxMenu
            buttonLabel="UAI"
            options={[
              { value: "true", label: "Connue" },
              { value: "false", label: UAI_INCONNUE_CAPITALIZE },
            ]}
            value={boolsToStrings(props.filters.etatUAI)}
            onChange={(etatUAI) => props.onFiltersChange({ etatUAI: stringsToBools(etatUAI) })}
          />
        )}

        {props.showFilterTransmission && (
          <FilterCheckboxMenu
            buttonLabel="Transmission"
            options={[
              { value: "recent", label: "Effectifs récemment transmis (< 1 mois)" },
              { value: "1_3_mois", label: "Effectifs transmis (entre 1 et 3 mois)" },
              { value: "arrete", label: "Arrêt des transmissions (> 3 mois)" },
              { value: "jamais", label: "Effectifs jamais transmis" },
            ]}
            value={props.filters.transmission}
            onChange={(transmission) => props.onFiltersChange({ transmission })}
          />
        )}

        {props.showFilterQualiopi && (
          <FilterCheckboxMenu
            buttonLabel="Certification qualiopi"
            options={[
              { value: "true", label: "Oui" },
              { value: "false", label: "Non" },
            ]}
            value={boolsToStrings(props.filters.qualiopi)}
            onChange={(qualiopi) => props.onFiltersChange({ qualiopi: stringsToBools(qualiopi) })}
          />
        )}

        {props.showFilterEtat && (
          <FilterCheckboxMenu
            buttonLabel="État"
            options={[
              { value: "false", label: "En activité" },
              { value: "true", label: "Fermé" },
            ]}
            value={boolsToStrings(props.filters.ferme)}
            onChange={(ferme) => props.onFiltersChange({ ferme: stringsToBools(ferme) })}
          />
        )}

        <button type="button" className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm" onClick={props.onReset}>
          réinitialiser
        </button>
      </div>
    </div>
  );
}
