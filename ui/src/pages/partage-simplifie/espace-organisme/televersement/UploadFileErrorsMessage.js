import { Box, Stack } from "@chakra-ui/react";

import AlertBlock from "../../../../common/components/AlertBlock/AlertBlock.js";

const UploadFileErrorsMessage = () => {
  return (
    <Stack marginTop="2w" spacing="2w">
      <AlertBlock variant="error">
        <strong>Erreurs dans votre fichier transmis.</strong>
        <Box marginLeft="2w" marginBottom="2w">
          <ul>
            <li>Soit un champ obligatoire n&apos;est pas rempli</li>
            <li>Soit le format demandé est erroné</li>
          </ul>
        </Box>
        Veuillez corriger les champs indiqués ci-dessous et téléversez à nouveau votre fichier.
      </AlertBlock>
    </Stack>
  );
};

export default UploadFileErrorsMessage;
