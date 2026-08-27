"use client";

import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { DEPARTEMENTS_SORTED, IOrganisationType, REGIONS_SORTED, UAI_INCONNUE_CAPITALIZE } from "shared";

import { FilterCheckboxMenu } from "@/app/_components/filters/FilterCheckboxMenu";
import styles from "@/app/_components/filters/filters.module.scss";
import { useAuth } from "@/app/_context/UserContext";
import { OrganismesFilters } from "@/common/filters/organismes-filters";

const NATURE_LABELS: Record<string, string> = {
  responsable: "Responsable",
  formateur: "Formateur",
  responsable_formateur: "Responsable formateur",
  inconnue: "Nature inconnue",
};

const TRANSMISSION_LABELS: Record<string, string> = {
  recent: "Transmis < 1 mois",
  "1_3_mois": "Transmis entre 1 et 3 mois",
  arrete: "Arrêt des transmissions",
  jamais: "Jamais transmis",
};

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

  const removeValue = <K extends keyof OrganismesFilters>(key: K, value: OrganismesFilters[K][number]) => {
    props.onFiltersChange({
      [key]: (props.filters[key] as Array<typeof value>).filter((item) => item !== value),
    } as Partial<OrganismesFilters>);
  };

  const activeTags: Array<{ key: string; label: string; onDismiss: () => void }> = [
    ...props.filters.departements.map((code) => ({
      key: `departement-${code}`,
      label: `Département ${code}`,
      onDismiss: () => removeValue("departements", code),
    })),
    ...props.filters.regions.map((code) => ({
      key: `region-${code}`,
      label: REGIONS_SORTED.find((region) => region.code === code)?.nom ?? `Région ${code}`,
      onDismiss: () => removeValue("regions", code),
    })),
    ...props.filters.nature.map((nature) => ({
      key: `nature-${nature}`,
      label: NATURE_LABELS[nature] ?? nature,
      onDismiss: () => removeValue("nature", nature),
    })),
    ...props.filters.etatUAI.map((etat) => ({
      key: `uai-${etat}`,
      label: etat ? "UAI connue" : `UAI ${UAI_INCONNUE_CAPITALIZE.toLowerCase()}`,
      onDismiss: () => removeValue("etatUAI", etat),
    })),
    ...props.filters.transmission.map((state) => ({
      key: `transmission-${state}`,
      label: TRANSMISSION_LABELS[state] ?? state,
      onDismiss: () => removeValue("transmission", state),
    })),
    ...props.filters.qualiopi.map((value) => ({
      key: `qualiopi-${value}`,
      label: value ? "Certifié Qualiopi" : "Non certifié Qualiopi",
      onDismiss: () => removeValue("qualiopi", value),
    })),
    ...props.filters.ferme.map((value) => ({
      key: `ferme-${value}`,
      label: value ? "SIRET fermé" : "SIRET en activité",
      onDismiss: () => removeValue("ferme", value),
    })),
  ];

  return (
    <div className={styles.filterPanel}>
      <p className={styles.filterPanelLabel}>Filtrer par</p>
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

        {activeTags.length > 0 && (
          <button type="button" className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm" onClick={props.onReset}>
            Réinitialiser
          </button>
        )}
      </div>

      {activeTags.length > 0 && (
        <div className={styles.activeTagsRow}>
          {activeTags.map((tag) => (
            <Tag key={tag.key} small dismissible nativeButtonProps={{ onClick: tag.onDismiss, type: "button" }}>
              {tag.label}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}
