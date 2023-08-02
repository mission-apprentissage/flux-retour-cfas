import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Text,
  Box,
  HStack,
  useDisclosure,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Stack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import React, { Fragment } from "react";

import { getStatutApprenantNameFromCode } from "@/common/constants/dossierApprenant";
import { _get } from "@/common/httpClient";
import { formatDateDayMonthYear, prettyPrintDate } from "@/common/utils/dateUtils";
import { toPascalCase } from "@/common/utils/stringUtils";
import { Close } from "@/theme/components/icons";

import EffectifDoublonDeleteAlertDialog from "./EffectifDoublonDeleteAlertDialog";

const EffectifDoublonDetailModal = ({
  isOpen,
  onClose = () => {},
  effectifId,
}: {
  isOpen: boolean;
  onClose?: () => void;
  effectifId: string;
}) => {
  const { data: effectifDetail } = useQuery<any, any>(
    [`effectif`, effectifId],
    () => _get(`/api/v1/effectif/detail/${effectifId}`),
    { enabled: isOpen }
  );

  const { isOpen: isOpenAlertDialog, onOpen: onOpenAlertDialog, onClose: onCloseAlertDialog } = useDisclosure();
  const cancelRef = React.useRef();

  return (
    <>
      <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} size={"5xl"}>
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
            {effectifDetail && (
              <Text>
                {`Détail de l'apprenant ${toPascalCase(effectifDetail?.apprenant?.prenom)} ${toPascalCase(
                  effectifDetail?.apprenant?.nom
                )} (${effectifId})`}
              </Text>
            )}
          </ModalHeader>
          <ModalBody pb={6}>
            {effectifDetail && (
              <Stack spacing={6}>
                <Text>Dossier créé le {prettyPrintDate(effectifDetail?.created_at)}</Text>
                <Text>Dossier mis à jour le {prettyPrintDate(effectifDetail?.updated_at)}</Text>
                {/* Infos Apprenant */}
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th colSpan={2}>Apprenant</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>
                          <i>Prénom</i>
                        </Td>
                        <Td>
                          <b>{toPascalCase(effectifDetail?.apprenant?.prenom)}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Nom</i>
                        </Td>
                        <Td>
                          <b>{toPascalCase(effectifDetail?.apprenant?.nom)}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Numéro INE</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.apprenant?.ine}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Date de naissance</i>
                        </Td>
                        <Td>
                          <b>{formatDateDayMonthYear(effectifDetail?.apprenant?.date_de_naissance)}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Courriel</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.apprenant?.courriel}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Téléphone</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.apprenant?.telephone}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Identifiant ERP</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.id_erp_apprenant}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Année scolaire</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.annee_scolaire}</b>
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>

                {/* Adresse */}
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th colSpan={2}>Adresse</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>
                          <i>Code insee</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.apprenant?.adresse?.code_insee}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Code postal</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.apprenant?.adresse?.code_postal}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Commune</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.apprenant?.adresse?.commune}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Département</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.apprenant?.adresse?.departement}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Académie</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.apprenant?.adresse?.academie}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Région</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.apprenant?.adresse?.region}</b>
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>

                {/* Formation */}
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th colSpan={2}>Formation</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>
                          <i>Libellé de la formation</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.formation?.libelle_long}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Code formation diplôme</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.formation?.cfd}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Code rncp</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.formation?.rncp}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Période de formation</i>
                        </Td>
                        <Td>
                          <b>{`${effectifDetail?.formation?.periode[0]} - ${effectifDetail?.formation?.periode[1]}`}</b>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>
                          <i>Année de la formation</i>
                        </Td>
                        <Td>
                          <b>{effectifDetail?.formation?.annee}</b>
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>

                {/* Contrats */}
                {effectifDetail?.contrats?.map((contrat, index) => (
                  <TableContainer key={`tableContrats_${index}`}>
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th colSpan={2}>Contrats</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr>
                          <Td>
                            <i>Date de début de contrat</i>
                          </Td>
                          <Td>
                            <b>{formatDateDayMonthYear(contrat?.date_debut)}</b>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td>
                            <i>Date de fin de contrat</i>
                          </Td>
                          <Td>
                            <b>{formatDateDayMonthYear(contrat?.date_fin)}</b>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td>
                            <i>Date de rupture de contrat</i>
                          </Td>
                          <Td>
                            <b>{contrat?.date_rupture && formatDateDayMonthYear(contrat?.date_rupture)}</b>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td>
                            <i>Cause de rupture de contrat</i>
                          </Td>
                          <Td>
                            <b>{contrat?.cause_rupture && formatDateDayMonthYear(contrat?.cause_rupture)}</b>
                          </Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </TableContainer>
                ))}

                {/* Historique */}
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th colSpan={2}>Historique de l&apos;apprenant</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {effectifDetail?.apprenant?.historique_statut.map((currentStatut, index) => (
                        <Tr key={`rowHisto_${index}`}>
                          <Td>
                            <i>Statut</i>
                            <b>{` ${getStatutApprenantNameFromCode(currentStatut.valeur_statut)} `}</b>
                            {`à la date du `}
                            <b>{`${prettyPrintDate(currentStatut.date_statut)} `}</b>
                            <i>{`(reçu le ${prettyPrintDate(currentStatut.date_reception)})`}</i>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Stack>
            )}
          </ModalBody>

          <ModalFooter>
            <HStack spacing={4}>
              <Button
                variant="primary"
                onClick={() => {
                  onClose?.();
                  onOpenAlertDialog?.();
                }}
                type="submit"
              >
                <Box as="i" className="ri-delete-bin-7-line" mr={2} />
                <Text as="span">Supprimer l&apos;apprenant ?</Text>
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  onClose?.();
                }}
                type="submit"
              >
                <Box as="i" className="ri-arrow-go-back-fill" mr={2} />
                <Text as="span">Conserver l&apos;apprenant</Text>
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <EffectifDoublonDeleteAlertDialog
        cancelRef={cancelRef}
        isOpen={isOpenAlertDialog}
        onClose={onCloseAlertDialog}
        effectifId={effectifId}
        apprenantNomPrenom={`${toPascalCase(effectifDetail?.apprenant?.prenom)} ${toPascalCase(
          effectifDetail?.apprenant?.nom
        )}`}
      />
    </>
  );
};

export default EffectifDoublonDetailModal;
