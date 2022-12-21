import React, { useEffect, useRef } from "react";
import { Center, Spinner } from "@chakra-ui/react";
import EffectifsPage from "./engine/EffectifsPage.jsx";

import { organismeAtom } from "../../../hooks/organismeAtoms";
import { _get } from "../../../common/httpClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";
import ChoixTransmission from "./ChoixTransmission";
import TransmissionAPI from "./TransmissionAPI";
import { useRouter } from "next/router";
import Televersements from "./Televersements";

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
  const router = useRouter();
  const { slug } = router.query;

  const organisme = useRecoilValue(organismeAtom);
  const { isLoading, organismesEffectifs } = useOrganismesEffectifs();
  const televersementPage = slug.includes("televersement");

  if (isLoading && !televersementPage) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  const displayEffectifs = organisme.mode_de_transmission && organisme.setup_step_courante === "COMPLETE";

  return (
    <>
      {!organisme.mode_de_transmission && <ChoixTransmission />}
      {organisme.mode_de_transmission === "API" && organisme.setup_step_courante !== "COMPLETE" && <TransmissionAPI />}
      {displayEffectifs && televersementPage && <Televersements />}
      {displayEffectifs && !televersementPage && <EffectifsPage organismesEffectifs={organismesEffectifs} />}
    </>
  );
};

export default EffectifsOrganisme;
