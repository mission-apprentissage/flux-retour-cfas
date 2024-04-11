import { Box } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
import { useSetRecoilState } from "recoil";

import { effectifIdAtom } from "./atoms";
import Effectif from "./Effectif";

const EffectifTableDetails = ({ row, modeSifa = false, canEdit = false }) => {
  const queryClient = useQueryClient();
  const prevEffectifId = useRef(null);
  const setEffectifId = useSetRecoilState(effectifIdAtom);

  useEffect(() => {
    if (prevEffectifId.current !== row.original.id) {
      prevEffectifId.current = row.original.id;
      setEffectifId(row.original.id);
    }
  }, [queryClient, row, setEffectifId]);

  if (!row.original.id) {
    return null;
  }

  return (
    <Box>
      <Effectif modeSifa={modeSifa} canEdit={canEdit} parcours={row.original.statut.parcours} />
    </Box>
  );
};

export default EffectifTableDetails;
