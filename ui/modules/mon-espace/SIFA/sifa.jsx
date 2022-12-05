import React, { useEffect, useRef } from "react";
import { Center, Heading, Spinner } from "@chakra-ui/react";
import { useEspace } from "../../../hooks/useEspace";

import { organismeAtom } from "../../../hooks/organismeAtoms";
import { _get } from "../../../common/httpClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";
import EffectifsTable from "../effectifs/engine/EffectifsTable";

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

const EnqueteSIFA = () => {
  const { isMonOrganismePages, isOrganismePages } = useEspace();
  const { isLoading, organismesEffectifs } = useOrganismesEffectifs();

  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {isMonOrganismePages && `Mon Enquete SIFA2`}
        {isOrganismePages && `Son Enquete SIFA2`}
      </Heading>

      <EffectifsTable organismesEffectifs={organismesEffectifs} modeSifa />
    </>
  );
};

export default EnqueteSIFA;
