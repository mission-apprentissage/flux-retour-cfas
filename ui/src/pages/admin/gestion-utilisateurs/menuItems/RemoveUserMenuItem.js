import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  MenuItem,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { useMutation, useQueryClient } from "react-query";

import { deleteUser } from "../../../../common/api/tableauDeBord";
import { QUERY_KEYS } from "../../../../common/constants/queryKeys";

const RemoveUserMenuItem = ({ username }) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  const queryClient = useQueryClient();

  const { mutate } = useMutation(
    () => {
      return deleteUser(username);
    },
    {
      onSuccess() {
        toast({
          title: "Utilisateur supprimé avec succès.",
          status: "success",
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
        queryClient.invalidateQueries([QUERY_KEYS.USERS]);
      },
      onSettled() {
        onClose();
      },
    }
  );

  return (
    <>
      <MenuItem size="sm" variant="secondary" onClick={onOpen}>
        <Box as="i" className="ri-delete-bin-2-line" marginRight="1w" />
        Supprimer l&apos;utilisateur
      </MenuItem>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader backgroundColor="galt" fontSize="lg" fontWeight="bold">
              Supprimer un utilisateur
            </AlertDialogHeader>

            <AlertDialogBody>Êtes-vous sur de vouloir supprimer l&apos;utilisateur {username} ?</AlertDialogBody>

            <AlertDialogFooter>
              <Button variant="secondary" ref={cancelRef} onClick={onClose}>
                Annuler
              </Button>
              <Button variant="primary" onClick={mutate} marginLeft={3}>
                Supprimer l&apos;utilisateur
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

RemoveUserMenuItem.propTypes = {
  username: PropTypes.string.isRequired,
};

export default RemoveUserMenuItem;
