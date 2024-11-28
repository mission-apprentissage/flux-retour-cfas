import { Box } from "@chakra-ui/react";
import React from "react";

import { BasicModal } from "@/components/Modals/BasicModal";
import { Trash } from "@/theme/components/icons";

export const RemoveOrganisme: React.FC = () => {
  return (
    <BasicModal
      title="Suppression de l’organisme AFTRAL du réseau"
      button={
        <Box display="flex" justifyContent="center" alignItems="center">
          <Trash height={4} width={4} color="bluefrance" _hover={{ cursor: "pointer" }} />
        </Box>
      }
      size="6xl"
    >
      <p>Cette opération est irréversible.</p>
      <p>
        Êtes-vous sûr.e de vouloir supprimer cet organisme du réseau ? Il ne sera plus identifié comme appartenant à ce
        réseau et ne sera plus visible dans l’espace de la tête de réseau.
      </p>
    </BasicModal>
  );
};
