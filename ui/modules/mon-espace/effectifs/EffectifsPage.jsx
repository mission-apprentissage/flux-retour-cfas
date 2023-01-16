import React, { useEffect, useRef } from "react";
import { Center, Spinner } from "@chakra-ui/react";
import Effectifs from "./engine/Effectifs.jsx";

import { organismeAtom } from "../../../hooks/organismeAtoms";
import { _get } from "../../../common/httpClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetRecoilState, useRecoilValue } from "recoil";
import ChoixTransmission from "./ChoixTransmission";
import TransmissionAPI from "./TransmissionAPI";
import { useRouter } from "next/router";
import Televersements from "./Televersements";
import { effectifsStateAtom } from "./engine/atoms.js";

function useOrganismesEffectifs() {
  const organisme = useRecoilValue(organismeAtom);
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);

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
    async () => {
      const organismesEffectifs = await _get(`/api/v1/organisme/effectifs?organisme_id=${organisme._id}`);

      // eslint-disable-next-line no-undef
      const newEffectifsState = new Map();
      for (const { id, validation_errors } of organismesEffectifs) {
        newEffectifsState.set(id, { validation_errors, requiredSifa: [] });
      }
      setCurrentEffectifsState(newEffectifsState);

      return organismesEffectifs;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  return { isLoading: isFetching || isLoading, organismesEffectifs: data || [] };
}

const EffectifsPage = () => {
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

  const displayEffectifs =
    (organisme.mode_de_transmission === "API" && organisme.erps?.length > 0) ||
    organisme.mode_de_transmission === "MANUEL";

  return (
    <>
      {!organisme.mode_de_transmission && <ChoixTransmission />}
      {organisme.mode_de_transmission === "API" && !organisme.erps && <TransmissionAPI />}
      {displayEffectifs && televersementPage && <Televersements />}
      {displayEffectifs && !televersementPage && <Effectifs organismesEffectifs={organismesEffectifs} />}
    </>
  );
};

export default EffectifsPage;
