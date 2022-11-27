import React, { useEffect, useRef, useState } from "react";
import { Box, Center, Heading, Spinner } from "@chakra-ui/react";
import { useEspace } from "../../../hooks/useEspace";
import EffectifsTable from "./engine/EffectifsTable.jsx";

import { organismeAtom } from "../../../hooks/organismeAtoms";
import { _get } from "../../../common/httpClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";
import ChoixTransmission from "./choixTransmission";

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
  const { isLoading, organismesEffectifs } = useOrganismesEffectifs();
  const [mode, setMode] = useState(null);

  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  const displayEffectifs = !!organismesEffectifs.length || mode === "manuel";

  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {isMonOrganismePages && `Mes effectifs`}
        {isOrganismePages && `Ses effectifs`}
      </Heading>

      {!organismesEffectifs.length && !mode && (
        <ChoixTransmission
          onModeClicked={(mod) => {
            setMode(mod);
          }}
        />
      )}
      {mode === "erp" && <Box mt={10}>STUFF ABOUT HOW TO ERP</Box>}
      {mode === "file" && <Box mt={10}>Upload page</Box>}
      {displayEffectifs && <EffectifsTable organismesEffectifs={organismesEffectifs} />}
    </>
  );
};

export default EffectifsOrganisme;
