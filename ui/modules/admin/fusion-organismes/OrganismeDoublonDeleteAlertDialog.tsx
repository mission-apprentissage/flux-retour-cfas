import {
  Button,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";

import { _delete, _post } from "@/common/httpClient";
import useToaster from "@/hooks/useToaster";
import { ArrowRightLine } from "@/theme/components/icons";

const OrganismeDoublonDeleteAlertDialog = ({
  isOpen,
  onClose = () => {},
  cancelRef,
  organismeSansUaiId,
  organismeFiableId,
}: {
  isOpen: boolean;
  onClose?: () => void;
  cancelRef;
  organismeSansUaiId: string;
  organismeFiableId: string;
}) => {
  const queryClient = useQueryClient();
  const { toastSuccess } = useToaster();

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} size={"4xl"}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            <ArrowRightLine mt="-0.5rem" />
            <Text as="span" ml="1rem" textStyle={"h4"}>
              Fusionner les organismes
            </Text>
          </AlertDialogHeader>

          <AlertDialogBody>
            <Stack spacing="8">
              <Text>
                En choisissant de fusionner les organismes, les informations qui les concernent seront regroupées en un
                seul organisme.
              </Text>
              <Text>
                Cela concerne les informations suivantes :
                <br />- effectifs
                <br />- paramétrage du ou des ERP
                <br />- comptes utilisateurs
              </Text>
              <Text>
                <strong>Cette action est irréversible.</strong>
              </Text>
            </Stack>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Annuler
            </Button>
            <Button
              colorScheme="red"
              onClick={async () => {
                await _post(`/api/v1/admin/fusion-organismes`, { organismeFiableId, organismeSansUaiId });
                toastSuccess("Les organismes ont bien été fusionnés !");
                queryClient.invalidateQueries(["admin/organismes-duplicates"]);
                onClose();
              }}
              ml={3}
            >
              Confirmer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default OrganismeDoublonDeleteAlertDialog;
