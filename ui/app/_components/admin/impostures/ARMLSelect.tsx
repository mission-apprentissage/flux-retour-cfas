import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { IOrganisationARML, IOrganisationCreate } from "shared";

import { _get } from "@/common/httpClient";

interface ARMLSelectProps {
  setOrganisation: (organisation: IOrganisationCreate | null) => void;
}

export const ARMLSelect = ({ setOrganisation }: ARMLSelectProps) => {
  const { data: armls } = useQuery<Array<IOrganisationARML>>(["arml"], async () => _get("/api/v1/mission-locale/arml"));

  const onSelectedArml = (armlId: string) => {
    const arml = armls?.find(({ _id }) => _id.toString() === armlId);
    if (arml) {
      setOrganisation(arml);
    }
  };

  return (
    <FormControl isRequired mb={4}>
      <FormLabel>Vous représentez :</FormLabel>
      <Select placeholder="Sélectionner une ARML" onChange={(e) => onSelectedArml(e.target.value)}>
        {armls
          ?.sort((a, b) => a.nom.localeCompare(b.nom))
          .map((arml) => (
            <option value={arml._id.toString()} key={arml._id.toString()}>
              {arml.nom}
            </option>
          ))}
      </Select>
    </FormControl>
  );
};
