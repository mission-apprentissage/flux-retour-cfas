import React, { useEffect, useRef } from "react";
import { Center, Heading, Spinner } from "@chakra-ui/react";
import { useEspace } from "../../../hooks/useEspace";
import EffectifsTable from "./engine/EffectifsTable.jsx";

import { organismeAtom } from "../../../hooks/organismeAtoms";
import { _get } from "../../../common/httpClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";
import ChoixTransmission from "./choixTransmission";
import TransmissionAPI from "./TransmissionAPI";
import TransmissionFichier from "./TransmissionFichier";

function useOrganismesEffectifs() {
  const organisme = useRecoilValue(organismeAtom);
  const queryClient = useQueryClient();
  const prevOrganismeId = useRef(null);

  useEffect(() => {
    if (prevOrganismeId.current !== organisme._id) {
      prevOrganismeId.current = organisme._id;
      queryClient.resetQueries("organismesEffectifs", { exact: true });
    }
  }, [queryClient, organisme._id]);

  const { data, isLoading, isFetching } = useQuery(
    ["organismesEffectifs"],
    () => _get(`/api/v1/organisme/effectifs?organisme_id=${organisme._id}`),
    {
      refetchOnWindowFocus: false,
    }
  );

  return { isLoading: isFetching || isLoading, organismesEffectifs: data || [] };
}

const EffectifsOrganisme = () => {
  const { isMonOrganismePages, isOrganismePages } = useEspace();
  const organisme = useRecoilValue(organismeAtom);
  const { isLoading, organismesEffectifs } = useOrganismesEffectifs();

  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  const displayEffectifs =
    !!organismesEffectifs.length && organisme.mode_de_transmission && organisme.setup_step_courante === "COMPLETE";

  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {isMonOrganismePages && `Mes effectifs`}
        {isOrganismePages && `Ses effectifs`}
      </Heading>

      {!organisme.mode_de_transmission && <ChoixTransmission />}
      {organisme.mode_de_transmission === "API" && organisme.setup_step_courante !== "COMPLETE" && <TransmissionAPI />}
      {organisme.mode_de_transmission === "FICHIERS" && organisme.setup_step_courante !== "COMPLETE" && (
        <TransmissionFichier />
      )}
      {displayEffectifs && <EffectifsTable organismesEffectifs={organismesEffectifs} />}
    </>
  );
};

export default EffectifsOrganisme;
