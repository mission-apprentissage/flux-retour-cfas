import { Button, HStack, Stack, Switch, Text } from "@chakra-ui/react";
import { useState } from "react";
import { Commune, SITUATION_ENUM, SITUATION_LABEL_ENUM, STATUT_APPRENANT, STATUT_NAME } from "shared";

import FilterList from "@/components/Filter/FilterList";

interface ApprenantsFilterPanelProps {
  filters: Record<string, string[]>;
  availableFilters: Record<string, string[]>;
  communes: Commune[];
  onFilterChange: (filters: Record<string, string[] | boolean>) => void;
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

  const handleCheckboxChange = (filterKey: string, selectedValues: string[]) => {
    const updatedFilters = { ...filters, [filterKey]: selectedValues };
    onFilterChange(updatedFilters);
  };

  const handleRiskToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setARisque(newValue);

    const updatedFilters = {
      ...filters,
      a_risque: newValue,
    };

    onFilterChange(updatedFilters);
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
          selectedValues={filters["statut"] || []}
          onChange={(values) => handleCheckboxChange("statut", values)}
          isOpen={openFilter === "statut"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "statut" : null)}
          sortOrder="desc"
        />

        <FilterList
          key="rqth"
          filterKey="rqth"
          displayName="RQTH"
          options={{
            true: "Oui",
            false: "Non",
          }}
          selectedValues={filters["rqth"]?.map(String) || []}
          onChange={(values) => handleCheckboxChange("rqth", values)}
          isOpen={openFilter === "rqth"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "rqth" : null)}
          sortOrder="desc"
        />

        <FilterList
          key="mineur"
          filterKey="mineur"
          displayName="Mineur"
          options={{
            true: "Oui",
            false: "Non",
          }}
          selectedValues={filters["mineur"] || []}
          onChange={(values) => handleCheckboxChange("mineur", values)}
          isOpen={openFilter === "mineur"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "mineur" : null)}
          sortOrder="desc"
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
          selectedValues={filters["niveaux"] || []}
          onChange={(values) => handleCheckboxChange("niveaux", values)}
          isOpen={openFilter === "niveaux"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "niveaux" : null)}
          sortOrder="asc"
        />

        <FilterList
          key="code_insee"
          filterKey="code_insee"
          displayName={"Commune de résidence"}
          options={Object.fromEntries((communes || []).map(({ code_insee, commune }) => [code_insee, commune]))}
          selectedValues={filters["code_insee"] || []}
          onChange={(values) => handleCheckboxChange("code_insee", values)}
          isOpen={openFilter === "code_insee"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "code_insee" : null)}
          sortOrder="desc"
        />

        <FilterList
          key="situation"
          filterKey="situation"
          displayName="Situation"
          options={Object.fromEntries(
            Object.entries(SITUATION_ENUM).map(([key, value]) => [
              value,
              SITUATION_LABEL_ENUM[key as keyof typeof SITUATION_LABEL_ENUM],
            ])
          )}
          selectedValues={filters["situation"] || []}
          onChange={(values) => handleCheckboxChange("situation", values)}
          isOpen={openFilter === "situation"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "situation" : null)}
          sortOrder="asc"
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
