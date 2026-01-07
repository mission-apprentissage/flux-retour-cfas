import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
import { useSetRecoilState } from "recoil";

import { effectifIdAtom } from "./atoms";
import Effectif from "./Effectif";

const EffectifTableDetails = ({ row, canEdit = false }) => {
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
    <Effectif
      canEdit={canEdit}
      parcours={row?.original?.statut?.parcours || []}
      transmissionDate={row?.original?.transmitted_at || null}
    />
  );
};

export default EffectifTableDetails;
