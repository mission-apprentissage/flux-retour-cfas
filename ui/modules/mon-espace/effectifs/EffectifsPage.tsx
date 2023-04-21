import { Center, Spinner } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";

import ChoixTransmission from "./ChoixTransmission";
import { effectifsStateAtom } from "./engine/atoms";
import Effectifs from "./engine/Effectifs";
import Televersements from "./Televersements";
import TransmissionAPI from "./TransmissionAPI";

import { _get } from "@/common/httpClient";
import { organismeAtom } from "@/hooks/organismeAtoms";

function useOrganismesEffectifs(organismeId) {
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);

  const queryClient = useQueryClient();
  const prevOrganismeId = useRef(null);

  useEffect(() => {
    if (prevOrganismeId.current !== organismeId) {
      prevOrganismeId.current = organismeId;
      // queryClient.resetQueries("organismesEffectifs", { exact: true });
    }
  }, [queryClient, organismeId]);

  const { data, isLoading, isFetching } = useQuery<any, any>(
    ["organismesEffectifs", organismeId],
    async () => {
      const organismesEffectifs = await _get(`/api/v1/organismes/${organismeId}/effectifs`);

      // eslint-disable-next-line no-undef
      const newEffectifsState = new Map();
      for (const { id, validation_errors } of organismesEffectifs) {
        newEffectifsState.set(id, { validation_errors, requiredSifa: [] });
      }
      setCurrentEffectifsState(newEffectifsState);

      return organismesEffectifs;
    },
    {
      enabled: !!organismeId,
    }
  );

  return { isLoading: isFetching || isLoading, organismesEffectifs: data || [] };
}

const EffectifsPage = ({ isMine }) => {
  const organisme = useRecoilValue<any>(organismeAtom);
  const { isLoading, organismesEffectifs } = useOrganismesEffectifs(organisme?._id);

  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  if (!organisme) return null;

  if (!organisme.mode_de_transmission) {
    return <ChoixTransmission organisme={organisme} />;
  } else if (organisme.mode_de_transmission === "API") {
    if (organisme.erps?.length === 0 && !organisme.first_transmission_date) {
      return <TransmissionAPI isMine={isMine} organisme={organisme} />;
    } else {
      return <Effectifs isMine={isMine} organismesEffectifs={organismesEffectifs} />;
    }
  } else if (organisme.mode_de_transmission === "MANUAL") {
    return <Televersements organisme={organisme} />;
  } else {
    return <Effectifs isMine={isMine} organismesEffectifs={organismesEffectifs} />;
  }
};

export default EffectifsPage;
