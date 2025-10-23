import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { IOrganisationFranceTravail } from "shared";

import { _get } from "@/common/httpClient";

import { InscriptionOrganistionChildProps } from "./common";

export const InscriptionFranceTravail = ({
  setOrganisation,
}: InscriptionOrganistionChildProps & { title?: string }) => {
  const { data: franceTravailOrganisations } = useQuery<Array<IOrganisationFranceTravail>>(["ft"], async () =>
    _get("/api/v1/france-travail")
  );

  const onSelectedFranceTravail = (armlId: string) => {
    const arml = franceTravailOrganisations?.find(({ _id }) => _id.toString() === armlId);
    if (arml) {
      setOrganisation(arml);
    }
  };

  return (
    <FormControl isRequired mb={4}>
      <FormLabel>Votre structure régionale :</FormLabel>
      <Select placeholder="Sélectionner une région" onChange={(e) => onSelectedFranceTravail(e.target.value)}>
        {franceTravailOrganisations?.sort().map((arml) => (
          <option value={arml._id.toString()} key={arml._id.toString()}>
            {arml.nom}
          </option>
        ))}
      </Select>
    </FormControl>
  );
};
