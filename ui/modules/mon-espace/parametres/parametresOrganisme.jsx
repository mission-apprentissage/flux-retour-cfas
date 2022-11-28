import React from "react";
import { Box, Button, Heading, Text, useDisclosure } from "@chakra-ui/react";
import { useEspace } from "../../../hooks/useEspace";
import { hasContextAccessTo } from "../../../common/utils/rolesUtils";
import { AvatarPlus } from "../../../theme/components/icons";
// import { InviteModal } from "./InviteModal";

const ParametresOrganisme = ({ organisme }) => {
  const { isMonOrganismePages, isOrganismePages } = useEspace();
  const inviteModal = useDisclosure();
  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {isMonOrganismePages && `Paramètres de mon organisme`}
        {isOrganismePages && `Paramètres de son organisme`}
      </Heading>
      <Box mt={9}>
        {hasContextAccessTo(organisme, "organisme/page_parametres/gestion_acces") && (
          <>
            <Button size="md" onClick={inviteModal.onOpen} variant="secondary">
              <AvatarPlus />
              <Text as="span" ml={2}>
                Partager
              </Text>
            </Button>
            {/* <InviteModal
            title="Partage de l'organisme"
            size="md"
            isOpen={inviteModal.isOpen}
            onClose={inviteModal.onClose}
          /> */}
          </>
        )}
      </Box>
    </>
  );
};

export default ParametresOrganisme;
