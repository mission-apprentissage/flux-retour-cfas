import { Skeleton } from "@chakra-ui/react";
import React from "react";
import { Statut } from "shared";

import { EffectifForm } from "./effectifForm/EffectifForm";
import { EffectifFormControllerContext } from "./formEngine/EffectifFormControllerContext";
import { effectifFormSchema } from "./formEngine/effectifFormSchema";
import { useAutoSave } from "./formEngine/hooks/useAutoSave";
import { useInitEffectifForm } from "./formEngine/hooks/useInitEffectifForm";
import { useEffectifForm } from "./formEngine/useEffectifForm";

interface EffectifProps {
  canEdit: boolean;
  parcours: Statut["parcours"];
  transmissionDate: Date | null;
}

const Effectif = React.memo(function EffectifMemo({ canEdit = false, parcours, transmissionDate }: EffectifProps) {
  const { controller: effectifFormController } = useEffectifForm({ schema: effectifFormSchema });
  const { isLoading } = useInitEffectifForm({
    controller: effectifFormController,
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
        <EffectifForm parcours={parcours} transmissionDate={transmissionDate} />
      </EffectifFormControllerContext.Provider>
    </>
  );
});

export default Effectif;
