import { Button, HStack, Stack, Switch, Text } from "@chakra-ui/react";
import { useState } from "react";
import {
  API_SITUATION_ENUM,
  Commune,
  SITUATION_ENUM,
  SITUATION_LABEL_ENUM,
  STATUT_APPRENANT,
  STATUT_NAME,
} from "shared";
import { IEffectifsFiltersMissionLocale } from "shared/models/routes/mission-locale/missionLocale.api";

import { FilterList } from "@/components/Filter/FilterList";
import { FilterListSearchable } from "@/components/Filter/FilterListSearchable";
import { FilterRadioList } from "@/components/Filter/FilterRadioList";

interface ApprenantsFilterPanelProps {
  filters: IEffectifsFiltersMissionLocale;
  availableFilters: Record<string, string[]>;
  communes: Commune[];
  onFilterChange: (filters: IEffectifsFiltersMissionLocale) => void;
  resetFilters: () => void;
}

const ApprenantsFilterPanel: React.FC<ApprenantsFilterPanelProps> = ({
  filters,
  communes,
  onFilterChange,
  resetFilters,
}) => {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [aRisque, setARisque] = useState<boolean>(Boolean(filters["a_risque"]));

  const handleCheckboxChange = (filterKey: keyof IEffectifsFiltersMissionLocale, selectedValues: string[]) => {
    onFilterChange({ ...filters, [filterKey]: selectedValues });
  };

  const handleRadioChange = (filterKey: keyof IEffectifsFiltersMissionLocale, selectedValue: string | null) => {
    onFilterChange({ ...filters, [filterKey]: selectedValue ?? undefined });
  };

  const handleRiskToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setARisque(newValue);
    onFilterChange({ ...filters, a_risque: newValue });
  };

  return (
    <Stack spacing="0.5">
      <Text fontSize="zeta" fontWeight="extrabold">
        FILTRER PAR
      </Text>
      <Stack direction="row" spacing={0} wrap="wrap">
        <FilterList
          key="statut"
          filterKey="statut"
          displayName="Statut"
          options={{
            [STATUT_APPRENANT.INSCRIT]: STATUT_NAME[STATUT_APPRENANT.INSCRIT],
            [STATUT_APPRENANT.RUPTURANT]: STATUT_NAME[STATUT_APPRENANT.RUPTURANT],
            [STATUT_APPRENANT.ABANDON]: STATUT_NAME[STATUT_APPRENANT.ABANDON],
          }}
          selectedValues={(filters["statut"] as string[]) || []}
          onChange={(values) => handleCheckboxChange("statut", values)}
          isOpen={openFilter === "statut"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "statut" : null)}
          sortOrder="desc"
        />

        <FilterRadioList
          key="rqth"
          filterKey="rqth"
          displayName="RQTH"
          options={{
            true: "Oui",
            false: "Non",
          }}
          selectedValue={filters["rqth"]?.toString() || ""}
          onChange={(value) => handleRadioChange("rqth", value)}
          isOpen={openFilter === "rqth"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "rqth" : null)}
        />

        <FilterRadioList
          key="mineur"
          filterKey="mineur"
          displayName="Mineur"
          options={{
            true: "Oui",
            false: "Non",
          }}
          selectedValue={filters["mineur"]?.toString() || ""}
          onChange={(value) => handleRadioChange("mineur", value)}
          isOpen={openFilter === "mineur"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "mineur" : null)}
        />

        <FilterList
          key="niveaux"
          filterKey="niveaux"
          displayName={"Niveau de formation"}
          options={{
            3: "CAP, BEP...",
            4: "Baccalauréat",
            5: "BTS, DUT, DEUG",
            6: "Licence, Bachelor",
            7: "Master...",
            8: "Doctorat",
          }}
          selectedValues={(filters["niveaux"] as string[]) || []}
          onChange={(values) => handleCheckboxChange("niveaux", values)}
          isOpen={openFilter === "niveaux"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "niveaux" : null)}
          sortOrder="asc"
        />

        <FilterListSearchable
          key="code_adresse"
          filterKey="code_adresse"
          displayName={"Commune de résidence"}
          options={Object.fromEntries(
            (communes || []).map(({ code_insee, commune, code_postal }) => [
              `${code_insee}-${code_postal}`,
              `${commune} (${code_postal})`,
            ])
          )}
          selectedValues={(filters["code_adresse"] as string[]) || []}
          onChange={(values) => handleCheckboxChange("code_adresse", values)}
          isOpen={openFilter === "code_adresse"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "code_adresse" : null)}
        />

        <FilterRadioList
          key="last_update_value"
          filterKey="last_update_value"
          displayName="Fraîcheur de la donnée"
          options={{
            "7-BEFORE": "< 1 semaine",
            "7-AFTER": "> 1 semaine",
          }}
          selectedValue={
            filters["last_update_value"] && filters["last_update_order"]
              ? `${filters["last_update_value"]}-${filters["last_update_order"]}`
              : ""
          }
          onChange={(value) => {
            if (value) {
              const [lastUpdateValue, lastUpdateOrder] = value.split("-");
              onFilterChange({
                ...filters,
                last_update_value: Number(lastUpdateValue),
                last_update_order: lastUpdateOrder as "BEFORE" | "AFTER",
              });
            } else {
              onFilterChange({
                ...filters,
                last_update_value: undefined,
                last_update_order: undefined,
              });
            }
          }}
          isOpen={openFilter === "last_update_value"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "last_update_value" : null)}
        />

        <FilterList
          key="situation"
          filterKey="situation"
          displayName="Situation"
          options={Object.fromEntries([
            ...Object.entries(SITUATION_ENUM).map(([key, value]) => [
              value,
              SITUATION_LABEL_ENUM[key as keyof typeof SITUATION_LABEL_ENUM],
            ]),
            [API_SITUATION_ENUM.NON_TRAITE, "Non traité"],
          ])}
          selectedValues={(filters["situation"] as string[]) || []}
          onChange={(values) => handleCheckboxChange("situation", values)}
          isOpen={openFilter === "situation"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "situation" : null)}
          sortOrder="asc"
          withSortedOptions={false}
        />
        <Button variant="link" onClick={resetFilters} fontSize="omega">
          Réinitialiser
        </Button>
      </Stack>

      <HStack mt={6} spacing={4} alignItems="center">
        <Text>Afficher les jeunes &quot;à risque&quot;</Text>
        <Switch variant="icon" isChecked={aRisque} onChange={handleRiskToggle} />
      </HStack>
    </Stack>
  );
};

export default ApprenantsFilterPanel;
