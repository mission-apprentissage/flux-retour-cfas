import {
  Button,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Text,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";

import { _delete } from "@/common/httpClient";
import Ribbons from "@/components/Ribbons/Ribbons";
import { usePlausibleTracking } from "@/hooks/plausible";
import { ArrowRightLine } from "@/theme/components/icons";

const EffectifDoublonDeleteAllAlertDialog = ({
  isOpen,
  onClose = () => {},
  cancelRef,
  dusplicateCount,
  organismeId,
}: {
  isOpen: boolean;
  onClose?: () => void;
  cancelRef;
  dusplicateCount: number;
  organismeId: string;
}) => {
  const queryClient = useQueryClient();
  const { trackPlausibleEvent } = usePlausibleTracking();

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} size={"4xl"}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            <ArrowRightLine mt="-0.5rem" />
            <Text as="span" ml="1rem" textStyle={"h4"}>
              Suppression des {dusplicateCount} duplicats d&apos;apprenant
            </Text>
          </AlertDialogHeader>

          <AlertDialogBody>
            <Text fontWeight="bold">Seuls les duplicats les plus anciens seront supprimés.</Text>
            <Text>Cette opération est irréversible.</Text>
            <Ribbons variant="alert" mt={6}>
              <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
                Attention, veuillez vérifier que ce doublon n‘existe pas déjà dans votre système ERP pour éviter des
                erreurs de synchronisation des données.
              </Text>
            </Ribbons>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Annuler
            </Button>
            <Button
              colorScheme="red"
              onClick={async () => {
                trackPlausibleEvent("suppression_doublons_effectifs_en_lot", undefined, {
                  nb_doublons_supprimes_lot: dusplicateCount,
                });
                await _delete(`/api/v1/organismes/${organismeId}/duplicates`);
                queryClient.invalidateQueries(["duplicates-effectifs"]);
                onClose();
              }}
              ml={3}
            >
              Supprimer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default EffectifDoublonDeleteAllAlertDialog;
