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

  const onSelectedFranceTravail = (ftId: string) => {
    const ft = franceTravailOrganisations?.find(({ _id }) => _id.toString() === ftId);
    if (ft) {
      setOrganisation(ft);
    }
  };

  return (
    <FormControl isRequired mb={4}>
      <FormLabel>Votre structure régionale :</FormLabel>
      <Select placeholder="Sélectionner une région" onChange={(e) => onSelectedFranceTravail(e.target.value)}>
        {franceTravailOrganisations?.sort().map((ft) => (
          <option value={ft._id.toString()} key={ft._id.toString()}>
            {ft.nom}
          </option>
        ))}
      </Select>
    </FormControl>
  );
};
