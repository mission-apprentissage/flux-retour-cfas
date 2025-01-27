import { FormControl, FormLabel } from "@chakra-ui/react";

import { _get } from "@/common/httpClient";

import { InscriptionOrganistionChildProps } from "./common";
import { MissionLocaleSelect } from "./components/MissionLocaleSelect";

export const InscriptionMissionLocale = ({
  setOrganisation,
}: InscriptionOrganistionChildProps & { title?: string }) => {
  return (
    <FormControl isRequired mb={4}>
      <FormLabel>Vous représentez : </FormLabel>
      <MissionLocaleSelect setOrganisation={setOrganisation} />
    </FormControl>
  );
};
