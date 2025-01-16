import { Box, Button, Flex, useToast } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import React from "react";

import { _delete } from "@/common/httpClient";
import { BasicModal } from "@/components/Modals/BasicModal";
import { Trash } from "@/theme/components/icons";

export const RemoveOrganisme: React.FC<{
  reseauId: string;
  organismeId: string;
  organismeName: string;
  refetch: any;
}> = ({ reseauId, organismeId, organismeName, refetch }) => {
  const toast = useToast();

  const { mutateAsync: removeReseaux, isLoading: isRemoving } = useMutation(async () => {
    return await _delete(`/api/v1/admin/reseaux/${reseauId}/organismes/${organismeId}`);
  });

  const handleRemove = async (onClose: () => void) => {
    try {
      await removeReseaux();
      toast({
        title: "Succès",
        description: "L'organisme a été supprimé du réseau avec succès.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      refetch();
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'organisme.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <BasicModal
      title={`Suppression de l’organisme ${organismeName} du réseau`}
      button={
        <Box display="flex" justifyContent="center" alignItems="center">
          <Trash height={4} width={4} color="bluefrance" _hover={{ cursor: "pointer" }} />
        </Box>
      }
      renderFooter={(onClose) => (
        <Flex mt={6} justifyContent="flex-end" gap={4}>
          <Button textStyle="sm" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            textStyle="sm"
            variant="primary"
            onClick={() => handleRemove(onClose)}
            isLoading={isRemoving}
            isDisabled={isRemoving}
          >
            Supprimer
          </Button>
        </Flex>
      )}
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
