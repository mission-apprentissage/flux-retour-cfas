"use client";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { useMemo } from "react";
import {
  ACADEMIES_BY_CODE,
  ACADEMIES_SORTED,
  BASSINS_EMPLOI_SORTED,
  DEPARTEMENTS_BY_CODE,
  DEPARTEMENTS_SORTED,
  IReseau,
  ORGANISATION_TYPE,
  ORGANISATIONS_NATIONALES_MAP,
  REGIONS_BY_CODE,
  REGIONS_SORTED,
} from "shared";

import { FilterCheckboxMenu } from "@/app/_components/filters/FilterCheckboxMenu";
import { useAuth } from "@/app/_context/UserContext";
import { EffectifsFiltersFull } from "@/modules/models/effectifs-filters";

import { FiltreDateMois } from "./filters/FiltreDateMois";
import { FiltreFormationCfd } from "./filters/FiltreFormationCfd";
import { FiltreLocked } from "./filters/FiltreLocked";
import { FiltreSecteurProfessionnel } from "./filters/FiltreSecteurProfessionnel";
import styles from "./indicateurs.module.scss";

const TRANCHES_AGE = [
  { key: "-18", label: "< 18 ans" },
  { key: "18-20", label: "18 à 20 ans" },
  { key: "21-25", label: "21 à 25 ans" },
  { key: "26+", label: "26 ans et +" },
];

const NIVEAUX_LABELS: Record<string, string> = {
  "3": "Niveau 3 (CAP, BEP…)",
  "4": "Niveau 4 (Baccalauréat)",
  "5": "Niveau 5 (BTS, DUT, DEUG)",
  "6": "Niveau 6 (Licence, Bachelor)",
  "7": "Niveau 7 (Master…)",
  "8": "Niveau 8 (Doctorat)",
};

const NIVEAUX_ACTIFS_PAR_ORGANISATION: Record<string, string[]> = {
  [ORGANISATIONS_NATIONALES_MAP.EDUC_NATIONALE]: ["3", "4"],
  [ORGANISATIONS_NATIONALES_MAP.ENSEIGNEMENT_SUP]: ["5", "6", "7", "8"],
};

const ANNEES_FORMATION = [1, 2, 3, 4, 5];

interface IndicateursFiltersPanelProps {
  filters: EffectifsFiltersFull;
  reseaux: IReseau[];
  onChange: (newFilters: Partial<EffectifsFiltersFull>) => void;
  onReset: () => void;
}

export function IndicateursFiltersPanel({ filters, reseaux, onChange, onReset }: IndicateursFiltersPanelProps) {
  const { user } = useAuth();
  const organisation = user?.organisation as any;
  const organisationType = organisation?.type;

  const departementsOptions = useMemo(() => {
    switch (organisationType) {
      case "DDETS":
        return [];
      case "DREETS":
        return DEPARTEMENTS_SORTED.filter((departement) => departement.region.code === organisation?.code_region);
      case "ACADEMIE":
        return DEPARTEMENTS_SORTED.filter((departement) => departement.academie.code === organisation?.code_academie);
      default:
        return DEPARTEMENTS_SORTED;
    }
  }, [organisationType, organisation]);

  const niveauxActifs =
    organisationType === ORGANISATION_TYPE.OPERATEUR_PUBLIC_NATIONAL
      ? (NIVEAUX_ACTIFS_PAR_ORGANISATION[organisation?.nom] ?? Object.keys(NIVEAUX_LABELS))
      : Object.keys(NIVEAUX_LABELS);

  return (
    <div className={styles.filtersColumn}>
      <div className={styles.filtersHeader}>
        <h2 className={styles.filtersTitle}>Filtrer par</h2>
        <Button priority="secondary" size="small" onClick={onReset}>
          Réinitialiser
        </Button>
      </div>

      <div className={styles.filtersGroup}>
        <p className={styles.groupLabel}>
          Date
          <Tooltip
            kind="hover"
            title="La sélection du mois permet d’afficher les effectifs au dernier jour du mois. À noter : la période de référence pour l’année scolaire court du 1er août au 31 juillet."
          />
        </p>
        <FiltreDateMois value={filters.date} onChange={(date) => onChange({ date })} />
      </div>

      <div className={styles.filtersGroup}>
        <p className={styles.groupLabel}>Territoire</p>

        {organisationType === "DREETS" ? (
          <FiltreLocked value={REGIONS_BY_CODE[organisation?.code_region]?.nom} />
        ) : (
          !["DDETS", "ACADEMIE"].includes(organisationType) && (
            <FilterCheckboxMenu
              buttonLabel="Région"
              options={REGIONS_SORTED.map((region) => ({ value: region.code, label: region.nom }))}
              value={filters.organisme_regions}
              onChange={(organisme_regions) => onChange({ organisme_regions })}
            />
          )
        )}

        {organisationType === "DDETS" ? (
          <FiltreLocked
            value={`${organisation?.code_departement} - ${DEPARTEMENTS_BY_CODE[organisation?.code_departement]?.nom}`}
          />
        ) : (
          <FilterCheckboxMenu
            buttonLabel="Département"
            options={departementsOptions.map((departement) => ({
              value: departement.code,
              label: `${departement.code} - ${departement.nom}`,
            }))}
            value={filters.organisme_departements}
            onChange={(organisme_departements) => onChange({ organisme_departements })}
          />
        )}

        {organisationType === "ACADEMIE" ? (
          <FiltreLocked value={`Académie de ${ACADEMIES_BY_CODE[organisation?.code_academie]?.nom}`} />
        ) : (
          !["DREETS", "DDETS"].includes(organisationType) && (
            <FilterCheckboxMenu
              buttonLabel="Académies"
              options={ACADEMIES_SORTED.map((academie) => ({ value: academie.code, label: academie.nom }))}
              value={filters.organisme_academies}
              onChange={(organisme_academies) => onChange({ organisme_academies })}
            />
          )
        )}

        {organisationType !== "ORGANISME_FORMATION" && (
          <FilterCheckboxMenu
            buttonLabel="Zone d’emploi"
            options={BASSINS_EMPLOI_SORTED.map((bassin) => ({ value: bassin.code, label: bassin.nom }))}
            value={filters.organisme_bassinsEmploi}
            onChange={(organisme_bassinsEmploi) => onChange({ organisme_bassinsEmploi })}
          />
        )}
      </div>

      <div className={styles.filtersGroup}>
        <p className={styles.groupLabel}>Domaine d’activité</p>
        <FiltreSecteurProfessionnel
          value={filters.formation_secteursProfessionnels}
          onChange={(formation_secteursProfessionnels) => onChange({ formation_secteursProfessionnels })}
        />
      </div>

      <div className={styles.filtersGroup}>
        <p className={styles.groupLabel}>Formation</p>

        <FiltreFormationCfd
          value={filters.formation_cfds}
          onChange={(formation_cfds) => onChange({ formation_cfds })}
        />

        <Accordion
          label={`Niveau de formation${filters.formation_niveaux.length ? ` (${filters.formation_niveaux.length})` : ""}`}
        >
          <Checkbox
            small
            options={Object.entries(NIVEAUX_LABELS).map(([key, label]) => ({
              label,
              nativeInputProps: {
                checked: filters.formation_niveaux.includes(key),
                disabled: !niveauxActifs.includes(key),
                onChange: (event) =>
                  onChange({
                    formation_niveaux: event.target.checked
                      ? [...filters.formation_niveaux, key]
                      : filters.formation_niveaux.filter((niveau) => niveau !== key),
                  }),
              },
            }))}
          />
        </Accordion>

        <Accordion
          label={`Année de formation${filters.formation_annees.length ? ` (${filters.formation_annees.length})` : ""}`}
        >
          <Checkbox
            small
            options={ANNEES_FORMATION.map((annee) => ({
              label: `${annee}`,
              nativeInputProps: {
                checked: filters.formation_annees.includes(annee),
                onChange: (event) =>
                  onChange({
                    formation_annees: event.target.checked
                      ? [...filters.formation_annees, annee]
                      : filters.formation_annees.filter((item) => item !== annee),
                  }),
              },
            }))}
          />
        </Accordion>
      </div>

      <div className={styles.filtersGroup}>
        <p className={styles.groupLabel}>Apprenant</p>

        <Accordion
          label={`Tranche d’âge${filters.apprenant_tranchesAge.length ? ` (${filters.apprenant_tranchesAge.length})` : ""}`}
        >
          <Checkbox
            small
            options={TRANCHES_AGE.map((tranche) => ({
              label: tranche.label,
              nativeInputProps: {
                checked: filters.apprenant_tranchesAge.includes(tranche.key),
                onChange: (event) =>
                  onChange({
                    apprenant_tranchesAge: event.target.checked
                      ? [...filters.apprenant_tranchesAge, tranche.key]
                      : filters.apprenant_tranchesAge.filter((item) => item !== tranche.key),
                  }),
              },
            }))}
          />
        </Accordion>

        <Accordion label="Genre">
          <p className={styles.disabledFilterHint}>Filtre bientôt disponible</p>
        </Accordion>
      </div>

      <div className={styles.filtersGroup}>
        <p className={styles.groupLabel}>Organisme</p>

        {organisationType !== "TETE_DE_RESEAU" && (
          <Accordion
            label={`Réseau d’organismes${filters.organisme_reseaux.length ? ` (${filters.organisme_reseaux.length})` : ""}`}
          >
            <Checkbox
              small
              options={reseaux.map((reseau) => ({
                label: reseau.nom,
                nativeInputProps: {
                  checked: filters.organisme_reseaux.includes(reseau.key),
                  onChange: (event) =>
                    onChange({
                      organisme_reseaux: event.target.checked
                        ? [...filters.organisme_reseaux, reseau.key]
                        : filters.organisme_reseaux.filter((item) => item !== reseau.key),
                    }),
                },
              }))}
            />
          </Accordion>
        )}

        <Accordion label={`Établissement${filters.organisme_search ? " (1)" : ""}`}>
          <Input
            label=""
            nativeInputProps={{
              placeholder: "UAI/SIRET",
              value: filters.organisme_search,
              onChange: (event) => onChange({ organisme_search: event.target.value }),
            }}
          />
        </Accordion>
      </div>
    </div>
  );
}
