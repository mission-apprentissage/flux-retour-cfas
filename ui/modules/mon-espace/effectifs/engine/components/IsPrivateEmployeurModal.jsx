import React from "react";
import { Text, Link } from "@chakra-ui/react";
import AcknowledgeModal from "../../../components/Modals/AcknowledgeModal";

const IsPrivateEmployeurModal = ({ isOpen, onClose, onAcknowledgement }) => {
  return (
    <AcknowledgeModal
      title="Vous êtes employeur privé"
      isOpen={isOpen}
      onClose={onClose}
      onAcknowledgement={onAcknowledgement}
    >
      <Text>
        Ce service de dépôt en ligne est reservé aux employeurs publics pour le moment. <br />
        Vous ne pourrez pas continuer ce dossier. <br />
        <br />
        Veuillez consulter{" "}
        <Link href={"/"} color={"bluefrance"} textDecoration={"underline"} isExternal>
          la fiche pratique
        </Link>{" "}
        pour établir un contrat d&apos;apprentissage en tant qu&apos;employeur privé.
      </Text>
    </AcknowledgeModal>
  );
};
export default IsPrivateEmployeurModal;
