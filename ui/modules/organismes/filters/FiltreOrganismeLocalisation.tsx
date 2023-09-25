import { useState } from "react";

import SimpleOverlayMenu from "@/modules/dashboard/SimpleOverlayMenu";

import { OrganismesFilterButton } from "./OrganismesFilterButton";

interface FiltreOrganismeLocalisationProps {
  value: string[];
  onChange: (value: string[]) => void;
}

function FiltreOrganismeLocalisation(props: FiltreOrganismeLocalisationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const localisations = props.value;

  return (
    <div>
      <OrganismesFilterButton
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        buttonLabel="Localisation"
        badge={localisations?.length}
      />
      {isOpen && (
        <SimpleOverlayMenu onClose={() => setIsOpen(false)} width="var(--chakra-sizes-lg)" p="3w">
          En cours
        </SimpleOverlayMenu>
      )}
    </div>
  );
}

export default FiltreOrganismeLocalisation;
