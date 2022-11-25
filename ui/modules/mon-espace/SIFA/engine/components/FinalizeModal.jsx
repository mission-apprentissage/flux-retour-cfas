import React, { useCallback } from "react";
import { Text } from "@chakra-ui/react";
import { _put } from "../../../common/httpClient";
import PromptModal from "../../../components/Modals/PromptModal";

const FinalizeModal = ({ dossier, ...modal }) => {
  let onReplyClicked = useCallback(async () => {
    try {
      await _put(`/api/v1/dossier/entity/${dossier._id}/publish`, {
        dossierId: dossier._id,
      });
      window.location.replace(window.location.pathname.replace(/\/[^/]*$/, "/signatures"));
    } catch (e) {
      console.error(e);
    }
  }, [dossier._id]);

  return (
    <>
      <PromptModal
        title="Souhaitez-vous finaliser ce dossier ?"
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        onOk={() => {
          onReplyClicked();
          modal.onClose();
        }}
        onKo={() => {
          onReplyClicked("non");
          modal.onClose();
        }}
        bgOverlay="rgba(0, 0, 0, 0.28)"
        okText={"Oui, passer au téléchargement"}
        koText={"Non, continuer l'édition"}
      >
        <Text mt={3}>Cette opération clôturera l&apos;édition de ce dossier :</Text>
        <Text mt={2}>
          <strong>toute modification ultérieure devra faire l&apos;objet d&apos;un avenant.</strong>
        </Text>

        <Text mt={5} fontStyle="italic">
          Vous pourrez consulter à tout moment ce dossier en lecture.
        </Text>
      </PromptModal>
    </>
  );
};
export default FinalizeModal;
