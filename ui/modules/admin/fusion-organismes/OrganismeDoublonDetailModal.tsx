import {
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import React from "react";

import { _get } from "@/common/httpClient";
import { ArrowRightLine, Close } from "@/theme/components/icons";

import { DuplicateOrganismeDetail } from "./models/DuplicateOrganismeDetail";
import OrganismeDoublonDeleteAlertDialog from "./OrganismeDoublonDeleteAlertDialog";

const OrganismeDoublonDetailModal = ({
  isOpen,
  onClose = () => {},
  duplicatesDetail,
}: {
  isOpen: boolean;
  onClose?: () => void;
  duplicatesDetail: DuplicateOrganismeDetail[];
}) => {
  const { isOpen: isOpenAlertDialog, onOpen: onOpenAlertDialog, onClose: onCloseAlertDialog } = useDisclosure();
  const cancelRef = React.useRef();

  return (
    <>
      <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} size={"6xl"}>
        <ModalOverlay bg="rgba(0, 0, 0, 0.48)" />
        <ModalContent bg="white" color="primaryText" borderRadius="none">
          <Button
            display={"flex"}
            alignSelf={"flex-end"}
            color="bluefrance"
            fontSize={"epsilon"}
            onClick={() => {
              onClose?.();
            }}
            variant="unstyled"
            pt={10}
            pb={6}
            pr={10}
            fontWeight={400}
          >
            Fermer{" "}
            <Text as={"span"} ml={2}>
              <Close boxSize={4} />
            </Text>
          </Button>
          <ModalHeader>
            <ArrowRightLine mt="-0.5rem" />
            <Text as="span" ml="1rem" textStyle={"h4"}>
              Visualiser les duplicats
            </Text>
          </ModalHeader>
          <ModalBody pb={6}>
            {duplicatesDetail && (
              <Stack spacing={6}>
                <TableContainer>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Informations</Th>
                        <Th>Organisme 1</Th>
                        <Th>Organisme 2</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>Raison sociale</Td>
                        <Td>{duplicatesDetail[0]?.raison_sociale}</Td>
                        <Td>{duplicatesDetail[1]?.raison_sociale}</Td>
                      </Tr>
                      <Tr>
                        <Td>UAI</Td>
                        <Td>{duplicatesDetail[0]?.uai}</Td>
                        <Td>{duplicatesDetail[1]?.uai}</Td>
                      </Tr>
                      <Tr>
                        <Td>SIRET</Td>
                        <Td>{duplicatesDetail[0]?.siret}</Td>
                        <Td>{duplicatesDetail[1]?.siret}</Td>
                      </Tr>
                      <Tr>
                        <Td>Nature</Td>
                        <Td>{duplicatesDetail[0]?.nature}</Td>
                        <Td>{duplicatesDetail[1]?.nature}</Td>
                      </Tr>
                      <Tr>
                        <Td>Etat</Td>
                        <Td>{duplicatesDetail[0]?.ferme ? "Fermé" : "Ouvert"}</Td>
                        <Td>{duplicatesDetail[1]?.ferme ? "Fermé" : "Ouvert"}</Td>
                      </Tr>
                      <Tr>
                        <Td>Transmission au tableau de bord</Td>
                        <Td>{duplicatesDetail[0]?.last_transmission_date ? "Transmets" : "Ne transmets pas"}</Td>
                        <Td>{duplicatesDetail[1]?.last_transmission_date ? "Transmets" : "Ne transmets pas"}</Td>
                      </Tr>
                      <Tr>
                        <Td>Fiabilisation</Td>
                        <Td>{duplicatesDetail[0]?.uai ? "Fiable" : "Non fiable"}</Td>
                        <Td>{duplicatesDetail[1]?.uai ? "Fiable" : "Non fiable"}</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>
              </Stack>
            )}
          </ModalBody>

          <ModalFooter>
            <HStack spacing={4}>
              <Button
                variant="secondary"
                onClick={() => {
                  onClose?.();
                }}
                type="submit"
              >
                <Text as="span">Ignorer</Text>
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onClose?.();
                  onOpenAlertDialog?.();
                }}
                type="submit"
              >
                <Text as="span">Fusionner les organismes</Text>
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <OrganismeDoublonDeleteAlertDialog
        cancelRef={cancelRef}
        isOpen={isOpenAlertDialog}
        onClose={onCloseAlertDialog}
        duplicatesDetail={duplicatesDetail}
      />
    </>
  );
};

export default OrganismeDoublonDetailModal;
