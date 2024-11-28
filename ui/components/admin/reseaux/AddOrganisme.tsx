import { AddIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Tag, Text, useToast } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import { OrganismeSupportInfoJson } from "shared";

import { _put } from "@/common/httpClient";
import { AutoCompleteOrganismes } from "@/components/Autocomplete/Organismes";
import { BasicModal } from "@/components/Modals/BasicModal";

export const AddOrganisme: React.FC = () => {
  const [selectedOrganisme, setSelectedOrganisme] = useState<OrganismeSupportInfoJson | null>(null);
  const toast = useToast();

  const { mutateAsync: addReseaux, isLoading: isAdding } = useMutation(
    async ({ id, reseaux }: { id: string; reseaux: string[] }) => {
      return await _put(`/api/v1/admin/organismes/${id}/reseaux`, { reseaux });
    }
  );

  const handleAdd = async () => {
    if (!selectedOrganisme) return;

    const payload = {
      id: selectedOrganisme.siret,
      reseaux: ["AFTRAL"],
    };

    try {
      await addReseaux(payload);
      toast({
        title: "Succès",
        description: `Le réseau a été ajouté à l'organisme ${selectedOrganisme.tdb?.raison_sociale || "inconnu"}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setSelectedOrganisme(null);
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

  return (
    <BasicModal
      title="Ajouter un organisme au réseau AFTRAL"
      button={
        <Button textStyle="sm" variant="primary">
          <AddIcon boxSize={3} mr={2} />
          Ajouter un organisme
        </Button>
      }
      size="6xl"
    >
      <Box minH="400px">
        <AutoCompleteOrganismes onSelect={(organisme: OrganismeSupportInfoJson) => setSelectedOrganisme(organisme)} />

        {selectedOrganisme && (
          <Box p={4} borderRadius="md" mt={6} border="1px solid" borderColor="gray.200">
            <Flex direction="column" gap={4}>
              <Flex>
                <Text mr={2}>Raison sociale:</Text>
                <Tag variant="badge" colorScheme="grey_tag" size="lg" fontSize="epsilon" borderRadius="0">
                  {selectedOrganisme.tdb?.raison_sociale || "Inconnue"}
                </Tag>
              </Flex>
              <Flex>
                <Text mr={2}>Nom commercial:</Text>
                <Tag variant="badge" colorScheme="grey_tag" size="lg" fontSize="epsilon" borderRadius="0">
                  {selectedOrganisme.tdb?.enseigne || "Inconnue"}
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
                  {selectedOrganisme.tdb?.adresse?.complete || "Inconnue"}
                </Tag>
              </Flex>
              <Flex>
                <Text mr={2}>Réseau:</Text>
                <Tag variant="badge" colorScheme="grey_tag" size="lg" fontSize="epsilon" borderRadius="0">
                  {selectedOrganisme.tdb?.reseaux?.length ? selectedOrganisme.tdb.reseaux.join(", ") : "Inconnue"}
                </Tag>
              </Flex>
              <Flex>
                <Text mr={2}>SIRET:</Text>
                <Tag variant="badge" colorScheme="grey_tag" size="lg" fontSize="epsilon" borderRadius="0">
                  {selectedOrganisme.siret || "Inconnue"} (en activité)
                </Tag>
              </Flex>
            </Flex>
            <Text mt={4} fontStyle="italic">
              Êtes-vous sûr.e de vouloir rajouter cet organisme de votre réseau ?
            </Text>
            <Flex mt={6} justifyContent="flex-end">
              <Button textStyle="sm" variant="primary" onClick={handleAdd} isLoading={isAdding} isDisabled={isAdding}>
                Ajouter
              </Button>
            </Flex>
          </Box>
        )}
      </Box>
    </BasicModal>
  );
};
