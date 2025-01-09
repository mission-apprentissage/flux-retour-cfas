import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";

import { InscriptionOrganistionChildProps } from "./common";

export const InscriptionMissionLocale = ({ setOrganisation }: InscriptionOrganistionChildProps) => {
  const { data: missionLocales, isLoading } = useQuery(["mission-locale"], async () => _get("/api/v1/mission-locale"));

  if (!missionLocales || isLoading) {
    return null;
  }

  return (
    <FormControl isRequired mb={4}>
      <FormLabel>Vous représentez :</FormLabel>
      <Select
        placeholder="Sélectionner une mission locale"
        onChange={(e) => {
          const ml = missionLocales.find((ml) => Number(ml.id) === Number(e.target.value));
          setOrganisation({
            type: "MISSION_LOCALE",
            nom: ml.nom,
            siret: ml.siret,
            ml_id: ml.id,
          });
        }}
      >
        {missionLocales
          .sort((a, b) => a.localisation.ville.localeCompare(b.localisation.ville))
          .map((option, index) => (
            <option value={option.id} key={index}>
              {option.nom} ( {option.localisation.ville} - {option.localisation.cp} )
            </option>
          ))}
      </Select>
    </FormControl>
  );
};
