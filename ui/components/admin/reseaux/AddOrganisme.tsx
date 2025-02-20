import { AddIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Tag, Text, useToast } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import { OrganismeSupportInfoJson } from "shared";

import { _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { AutoCompleteOrganismes } from "@/components/Autocomplete/Organismes";
import { BasicModal } from "@/components/Modals/BasicModal";

interface AddOrganismeProps {
  reseauId: string; // e.g. "AGRI_UNREP"
  reseauName: string; // e.g. "AGRI_UNREP"
  refetch: any;
}

export const AddOrganisme = ({ reseauId, reseauName, refetch }: AddOrganismeProps) => {
  const [selectedOrganisme, setSelectedOrganisme] = useState<Organisme | null>(null);
  const toast = useToast();

  const { mutateAsync: addReseaux, isLoading: isAdding } = useMutation(
    async ({ organismeId }: { organismeId: string | null | undefined }) => {
      if (!selectedOrganisme) {
        throw new Error("No organisme selected");
      }
      return await _put(`/api/v1/admin/reseaux/${reseauId}`, { organismeId });
    }
  );

  const handleAdd = async (onClose: () => void) => {
    if (!selectedOrganisme) return;

    try {
      await addReseaux({
        organismeId: selectedOrganisme?._id,
      });

      toast({
        title: "Succès",
        description: `Le réseau a été ajouté à l'organisme ${selectedOrganisme?.raison_sociale || "inconnu"}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      refetch();
      setSelectedOrganisme(null);
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du réseau.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const isAlreadyInReseau = selectedOrganisme?.reseaux?.includes(reseauName);

  return (
    <BasicModal
      title={`Ajouter un organisme au réseau ${reseauName}`}
      button={
        <Button textStyle="sm" variant="primary">
          <AddIcon boxSize={3} mr={2} />
          Ajouter un organisme
        </Button>
      }
      size="6xl"
      renderFooter={(onClose) => (
        <Flex justifyContent="flex-end">
          {selectedOrganisme && (
            <Button
              textStyle="sm"
              variant="primary"
              onClick={() => handleAdd(onClose)}
              isLoading={isAdding}
              isDisabled={isAdding || isAlreadyInReseau}
            >
              Ajouter
            </Button>
          )}
        </Flex>
      )}
    >
      <Box minH="400px">
        <AutoCompleteOrganismes
          onSelect={(organisme: OrganismeSupportInfoJson) => setSelectedOrganisme(organisme as unknown as Organisme)}
        />

        {selectedOrganisme && (
          <Box p={4} borderRadius="md" mt={6} border="1px solid" borderColor="gray.200">
            <Flex direction="column" gap={4}>
              <Flex>
                <Text mr={2}>Raison sociale:</Text>
                <Tag variant="badge" colorScheme="grey_tag" size="lg" fontSize="epsilon" borderRadius="0">
                  {selectedOrganisme?.raison_sociale || "Inconnue"}
                </Tag>
              </Flex>
              <Flex>
                <Text mr={2}>Enseigne:</Text>
                <Tag variant="badge" colorScheme="grey_tag" size="lg" fontSize="epsilon" borderRadius="0">
                  {selectedOrganisme?.enseigne || "Inconnue"}
                </Tag>
              </Flex>
              <Flex>
                <Text mr={2}>UAI:</Text>
                <Tag variant="badge" colorScheme="grey_tag" size="lg" fontSize="epsilon" borderRadius="0">
                  {selectedOrganisme.uai || "Inconnue"}
                </Tag>
              </Flex>
              <Flex>
                <Text mr={2}>Domiciliation:</Text>
                <Tag variant="badge" colorScheme="grey_tag" size="lg" fontSize="epsilon" borderRadius="0">
                  {selectedOrganisme?.adresse?.complete || "Inconnue"}
                </Tag>
              </Flex>
              <Flex>
                <Text mr={2}>Réseau:</Text>
                <Tag variant="badge" colorScheme="grey_tag" size="lg" fontSize="epsilon" borderRadius="0">
                  {selectedOrganisme?.reseaux?.length ? selectedOrganisme.reseaux.join(", ") : "Inconnue"}
                </Tag>
              </Flex>
              <Flex>
                <Text mr={2}>SIRET:</Text>
                <Tag variant="badge" colorScheme="grey_tag" size="lg" fontSize="epsilon" borderRadius="0">
                  {selectedOrganisme.siret || "Inconnue"} (en activité)
                </Tag>
              </Flex>
            </Flex>

            {isAlreadyInReseau ? (
              <Text mt={4} color="red.600">
                Cet organisme fait déjà partie du réseau {reseauName}
              </Text>
            ) : (
              <Text mt={4} fontStyle="italic">
                Êtes-vous sûr.e de vouloir rajouter cet organisme à votre réseau ?
              </Text>
            )}
          </Box>
        )}
      </Box>
    </BasicModal>
  );
};
