import { Box, Skeleton } from "@chakra-ui/react";
import React from "react";
import { Statut } from "shared";

import { EffectifForm } from "./effectifForm/EffectifForm";
import { EffectifFormControllerContext } from "./formEngine/EffectifFormControllerContext";
import { effectifFormSchema } from "./formEngine/effectifFormSchema";
import { useAutoSave } from "./formEngine/hooks/useAutoSave";
import { useInitEffectifForm } from "./formEngine/hooks/useInitEffectifForm";
import { useEffectifForm } from "./formEngine/useEffectifForm";

interface EffectifProps {
  modeSifa: boolean;
  canEdit: boolean;
  parcours: Statut["parcours"];
  refetch: any;
}

const Effectif = React.memo(function EffectifMemo({
  modeSifa = false,
  canEdit = false,
  parcours,
  refetch,
}: EffectifProps) {
  const { controller: effectifFormController } = useEffectifForm({ schema: effectifFormSchema });
  const { isLoading } = useInitEffectifForm({
    controller: effectifFormController,
    modeSifa,
    canEdit,
  });
  useAutoSave({ controller: effectifFormController });

  if (isLoading) {
    return <Skeleton height="50px" startColor="grey.300" endColor="galt" my={5} />;
  }

  return (
    <>
      {/* @ts-expect-error */}
      <EffectifFormControllerContext.Provider value={effectifFormController}>
        <Box my={12} px={5}>
          <EffectifForm modeSifa={modeSifa} parcours={parcours} refetch={refetch} />
        </Box>
      </EffectifFormControllerContext.Provider>
    </>
  );
});

export default Effectif;
