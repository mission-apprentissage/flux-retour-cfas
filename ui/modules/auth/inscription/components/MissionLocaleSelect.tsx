import { Select } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";

import { SetterOrganisation } from "../common";

interface MissionLocaleSelectProps {
  setOrganisation: SetterOrganisation;
}

export const MissionLocaleSelect = ({ setOrganisation }: MissionLocaleSelectProps) => {
  const { data: missionLocales, isLoading } = useQuery(["mission-locale"], async () => _get("/api/v1/mission-locale"));

  return (
    <Select
      placeholder="Sélectionner une mission locale"
      onChange={(e) => {
        const ml = missionLocales.find((ml) => Number(ml.id) === Number(e.target.value));
        console.log(ml);
        if (!ml) {
          setOrganisation(null);
          return;
        }
        setOrganisation({
          type: "MISSION_LOCALE",
          nom: ml.nom,
          siret: ml.siret,
          ml_id: ml.id,
        });
      }}
    >
      {!isLoading &&
        missionLocales &&
        missionLocales
          .sort((a, b) => a.localisation.ville.localeCompare(b.localisation.ville))
          .map((option, index) => (
            <option value={option.id} key={index}>
              {option.nom} ( {option.localisation.ville} - {option.localisation.cp} )
            </option>
          ))}
    </Select>
  );
};
