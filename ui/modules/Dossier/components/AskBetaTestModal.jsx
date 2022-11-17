import React from "react";
import { useDisclosure, Text } from "@chakra-ui/react";
import { _put } from "../../../common/httpClient";
import useAuth from "../../../hooks/useAuth";
import { betaVersion, BetaFeatures } from "../../../components/BetaFeatures/BetaFeatures";
import PromptModal from "../../../components/Modals/PromptModal";

const AskBetaTestModal = () => {
  let [auth, setAuth] = useAuth();
  const betaModal = useDisclosure({ defaultIsOpen: auth.beta === null });

  const onReplyClicked = async (answer) => {
    try {
      let user = await _put(`/api/v1/profile/becomeBeta`, {
        beta: answer,
      });
      setAuth(user);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {auth.sub !== "anonymous" && auth.confirmed && auth.account_status === "CONFIRMED" && (
        <PromptModal
          title="Fonctionnalités avancées  - expérimentales"
          isOpen={betaModal.isOpen}
          onClose={betaModal.onClose}
          onOk={() => {
            onReplyClicked(betaVersion());
            betaModal.onClose();
          }}
          onKo={() => {
            onReplyClicked("non");
            betaModal.onClose();
          }}
          bgOverlay="rgba(0, 0, 0, 0.28)"
        >
          <Text mb={1}>
            Souhaitez-vous participer à l&apos;amélioration du service, en testant de nouvelles fonctionnalités ?
          </Text>
          <Text>Cette activation vous donnera accès à :</Text>
          <BetaFeatures borderColor={"dgalt"} borderWidth={1} px={4} py={3} maxH="30vh" my={3} />
          <Text>Vous pouvez à tout moment (dés)activer depuis votre profil les fonctionnalités en test</Text>
        </PromptModal>
      )}
    </>
  );
};
export default AskBetaTestModal;
