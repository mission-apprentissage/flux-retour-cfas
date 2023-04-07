import React from "react";
import { Box, Skeleton } from "@chakra-ui/react";

import { useCerfa } from "./formEngine/useCerfa";
import { cerfaSchema } from "./formEngine/cerfaSchema";
import { CerfaControllerContext } from "./formEngine/CerfaControllerContext";
import { useInitCerfa } from "./formEngine/hooks/useInitCerfa";
import { useAutoSave } from "./formEngine/hooks/useAutoSave";
import { CerfaForm } from "./cerfaForm/CerfaForm";

interface EffectifProps {
  modeSifa: boolean;
  canEdit: boolean;
  effectifsSnapshot: boolean;
}

const Effectif = React.memo(function EffectifMemo({
  modeSifa = false,
  canEdit = false,
  effectifsSnapshot = false,
}: EffectifProps) {
  const { controller: cerfaController } = useCerfa({ schema: cerfaSchema });
  const { isLoading } = useInitCerfa({ controller: cerfaController, modeSifa, canEdit, effectifsSnapshot });
  useAutoSave({ controller: cerfaController });

  if (isLoading) {
    return <Skeleton height="50px" startColor="grey.300" endColor="galt" my={5} />;
  }

  return (
    <>
      {/* @ts-ignore */}
      <CerfaControllerContext.Provider value={cerfaController}>
        <Box my={12} px={5}>
          {/* @ts-ignore */}
          <CerfaForm modeSifa={modeSifa} />
        </Box>
      </CerfaControllerContext.Provider>
    </>
  );
});

export default Effectif;
