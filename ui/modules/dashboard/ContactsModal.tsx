import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  Button,
  Link,
  ListItem,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SystemProps,
  Text,
  UnorderedList,
  useDisclosure,
} from "@chakra-ui/react";

import { User } from "@/common/internal/User";

interface ContactsModalProps extends SystemProps {
  contacts: User[];
}
function ContactsModal({ contacts, ...props }: ContactsModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Button
        variant="link"
        borderBottomStyle="solid"
        borderBottomWidth={1}
        borderRadius={0}
        p="2px"
        lineHeight="1.2em"
        onClick={onOpen}
        leftIcon={<ArrowForwardIcon />}
        {...props}
      >
        Autres contacts
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent borderRadius="0" p="2w" pb="4w">
          <ModalHeader display="flex" alignItems="center" fontSize="beta" pl="0">
            <ArrowForwardIcon boxSize={"8"} mr="2" />
            Contacts de l’OFA
          </ModalHeader>
          <ModalCloseButton size="lg" />

          <UnorderedList ml="30px !important">
            {contacts
              .sort((a, b) => (a.prenom < b.prenom ? -1 : 1))
              .map((contact) => (
                <ListItem key={contact.email} mt="2">
                  <Text as="span" fontWeight="bold">
                    {contact.prenom}{" "}
                    <Text as="span" textTransform="uppercase">
                      {contact.nom}
                    </Text>
                  </Text>
                  <br />
                  {contact.fonction}
                  <br />
                  <Link borderBottom="1px solid" _hover={{ textDecoration: "none" }} href={`mailto:${contact.email}`}>
                    {contact.email}
                  </Link>
                  <br />
                  {contact.telephone}
                </ListItem>
              ))}
          </UnorderedList>
        </ModalContent>
      </Modal>
    </>
  );
}
export default ContactsModal;
