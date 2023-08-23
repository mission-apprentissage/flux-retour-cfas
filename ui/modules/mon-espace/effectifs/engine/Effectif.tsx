import { Box, Skeleton } from "@chakra-ui/react";
import React from "react";

import { CerfaForm } from "./cerfaForm/CerfaForm";
import { CerfaControllerContext } from "./formEngine/CerfaControllerContext";
import { cerfaSchema } from "./formEngine/cerfaSchema";
import { useAutoSave } from "./formEngine/hooks/useAutoSave";
import { useInitCerfa } from "./formEngine/hooks/useInitCerfa";
import { useCerfa } from "./formEngine/useCerfa";

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
      {/* @ts-expect-error */}
      <CerfaControllerContext.Provider value={cerfaController}>
        <Box my={12} px={5}>
          <CerfaForm modeSifa={modeSifa} />
        </Box>
      </CerfaControllerContext.Provider>
    </>
  );
});

export default Effectif;
