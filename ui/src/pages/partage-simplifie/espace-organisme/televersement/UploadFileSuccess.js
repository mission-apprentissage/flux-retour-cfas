import { Stack, Text } from "@chakra-ui/react";

import AlertBlock from "../../../../common/components/AlertBlock/AlertBlock.js";

const UploadFileSuccess = () => {
  return (
    <Stack marginTop="2w" spacing="2w">
      <AlertBlock variant="success">
        <Text>
          <strong>Votre fichier est conforme et approuvé.</strong>
        </Text>
        <Text>Vous pouvez à tout moment retrouver l’historique de dépôt dans l’onglet dédié.</Text>
      </AlertBlock>
      <Text fontSize="epsilon" color="black">
        Vous pouvez vous déconnecter. N’oubliez pas de transmettre à nouveau ce fichier mis à jour avec vos nouvelles
        données dans 1 mois.
      </Text>
    </Stack>
  );
};

export default UploadFileSuccess;
