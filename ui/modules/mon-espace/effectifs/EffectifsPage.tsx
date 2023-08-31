import { Box, Center, Container, Spinner } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
import { useSetRecoilState } from "recoil";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";

import ChoixERP from "./ChoixERP";
import ChoixTransmission from "./ChoixTransmission";
import EffectifsBanner from "./EffectifsBanner";
import EffectifsBannerERPNotConfigured from "./EffectifsBannerERPNotConfigured";
import { effectifsStateAtom } from "./engine/atoms";
import Effectifs from "./engine/Effectifs";

function useOrganismesEffectifs(organismeId: string | null | undefined) {
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);

  const queryClient = useQueryClient();
  const prevOrganismeId = useRef<string | undefined | null>(null);

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
      for (const { id, validation_errors } of organismesEffectifs as any) {
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

type EffectifsPageProps = {
  isMine: boolean;
  organisme: Organisme | null | undefined;
};

const EffectifsPage = ({ isMine, organisme }: EffectifsPageProps) => {
  const { isLoading, organismesEffectifs } = useOrganismesEffectifs(organisme?._id);
  const { data: duplicates } = useQuery<any, any>(
    [`duplicates-effectifs`, organisme?._id],
    () => _get(`/api/v1/organismes/${organisme?._id}/duplicates`),
    {
      enabled: !!organisme?._id,
    }
  );

  if (!organisme) {
    return null;
  }

  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  let MainComponent;
  if (organisme.last_transmission_date) {
    MainComponent = (
      <Effectifs nbDuplicates={duplicates?.length || 0} isMine={isMine} organismesEffectifs={organismesEffectifs} />
    );
  } else if (organisme.mode_de_transmission === "API" && !organisme.erps?.length) {
    MainComponent = <ChoixERP isMine={isMine} organisme={organisme} />;
  } else {
    MainComponent = <ChoixTransmission organismeId={organisme._id} isMine={isMine} />;
  }

  return (
    <>
      {organisme.last_transmission_date ? (
        <EffectifsBanner organisme={organisme} isMine={isMine} />
      ) : (
        <EffectifsBannerERPNotConfigured isMine={isMine} />
      )}

      <Box w="100%" pt={[4, 6]} px={[1, 1, 2, 4]} mb={16}>
        <Container maxW="xl" px={0}>
          {MainComponent}
        </Container>
      </Box>
    </>
  );
};

export default EffectifsPage;
