import { Text } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { useRecoilValue } from "recoil";

import { _post } from "@/common/httpClient";
import PromptModal from "@/components/Modals/PromptModal";
import { organismeAtom } from "@/hooks/organismeAtoms";

// TODO https://github.com/mission-apprentissage/flux-retour-cfas/issues/2387
// ce composant a été partiellement développé, et n'est pas encore utilisé
const AjoutApprenantModal = (modal) => {
  const organisme = useRecoilValue<any>(organismeAtom);
  const onCreateEffectifClicked = useCallback(async () => {
    try {
      await _post("/api/v1/effectif", {
        organisme_id: organisme._id,
        annee_scolaire: "2020-2021",
        source: "televersement",
        apprenant: { nom: "Hanry", prenom: "Pablo" },
        formation: { cfd: "26033206" },
      });
      window.location.reload(); // TODO tmp
    } catch (e) {
      console.error(e);
    }
  }, [organisme?._id]);

  return (
    <>
      <PromptModal
        title="Nouvelle·au apprenant(e)"
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        onOk={() => {
          onCreateEffectifClicked();
          modal.onClose();
        }}
        onKo={() => {
          modal.onClose();
        }}
        bgOverlay="rgba(0, 0, 0, 0.28)"
        okText={"Ajouter"}
        koText={"Annuler"}
      >
        <Text mt={3}>FORMULAIRE </Text>
        <Text mt={3}>+ formulaire STATUT courant</Text>
      </PromptModal>
    </>
  );
};
export default AjoutApprenantModal;
