import { Button, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";

import FilterList from "@/components/Filter/FilterList";

interface ApprenantsFilterPanelProps {
  filters: Record<string, string[]>;
  availableFilters: Record<string, string[]>;
  onFilterChange: (filters: Record<string, string[]>) => void;
  resetFilters: () => void;
}

const ApprenantsFilterPanel: React.FC<ApprenantsFilterPanelProps> = ({ filters, onFilterChange, resetFilters }) => {
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const handleCheckboxChange = (filterKey: string, selectedValues: string[]) => {
    const updatedFilters = { ...filters, [filterKey]: selectedValues };
    onFilterChange(updatedFilters);
  };

  return (
    <Stack spacing="0.5">
      <Text fontSize="zeta" fontWeight="extrabold">
        FILTRER PAR
      </Text>
      <Stack direction="row" spacing={0} wrap="wrap">
        <FilterList
          key="rupture"
          filterKey="rupture"
          displayName="Statut"
          options={["Inscrit sans contrat", "Rupture de contrat", "Abandon"]}
          selectedValues={filters["rupture"] || []}
          onChange={(values) => handleCheckboxChange("rupture", values)}
          isOpen={openFilter === "rupture"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "rupture" : null)}
          sortOrder="desc"
        />

        <FilterList
          key="rqth"
          filterKey="rqth"
          displayName={"RQTH"}
          options={["Oui", "Non"]}
          selectedValues={filters["rqth"] || []}
          onChange={(values) => handleCheckboxChange("rqth", values)}
          isOpen={openFilter === "rqth"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "rqth" : null)}
          sortOrder="desc"
        />

        <FilterList
          key="mineur"
          filterKey="mineur"
          displayName={"Mineur"}
          options={["Oui", "Non"]}
          selectedValues={filters["mineur"] || []}
          onChange={(values) => handleCheckboxChange("mineur", values)}
          isOpen={openFilter === "mineur"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "mineur" : null)}
          sortOrder="desc"
        />

        <FilterList
          key="niveau_formation"
          filterKey="niveau_formation"
          displayName={"Niveau de formation"}
          options={[
            "3 (CAP, BEP...)",
            "4 (Baccalauréat)",
            "5 (BTS, DUT, DEUG)",
            "6 (Licence, Bachelor)",
            "7 (Master...)",
            "8 (Doctorat)",
          ]}
          selectedValues={filters["niveau_formation"] || []}
          onChange={(values) => handleCheckboxChange("niveau_formation", values)}
          isOpen={openFilter === "niveau_formation"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "niveau_formation" : null)}
          sortOrder="asc"
        />

        <FilterList
          key="commune_residence"
          filterKey="commune_residence"
          displayName={"Commune de résidence"}
          options={["Paris", "Lyon", "Marseille", "Autre"]}
          selectedValues={filters["commune_residence"] || []}
          onChange={(values) => handleCheckboxChange("commune_residence", values)}
          isOpen={openFilter === "commune_residence"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "commune_residence" : null)}
          sortOrder="desc"
        />

        <FilterList
          key="fraicheur_donnee"
          filterKey="fraicheur_donnee"
          displayName={"Fraîcheur de la donnée"}
          options={["< 1 semaine", "> 1 semaine"]}
          selectedValues={filters["fraicheur_donnee"] || []}
          onChange={(values) => handleCheckboxChange("fraicheur_donnee", values)}
          isOpen={openFilter === "fraicheur_donnee"}
          setIsOpen={(isOpen) => setOpenFilter(isOpen ? "fraicheur_donnee" : null)}
          sortOrder="asc"
        />

        <FilterList
          key="situation"
          filterKey="situation"
          displayName={"Situation"}
          options={[
            "Contacté, soutien nécessaire",
            "Contacté, pas de suivi nécessaire",
            "Déjà accompagné par ML",
            "Injoignable",
            "Non contacté",
          ]}
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
    </Stack>
  );
};

export default ApprenantsFilterPanel;
