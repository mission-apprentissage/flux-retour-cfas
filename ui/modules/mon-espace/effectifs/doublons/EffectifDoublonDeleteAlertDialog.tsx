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
import { useRecoilValue } from "recoil";

import { _delete } from "@/common/httpClient";
import Ribbons from "@/components/Ribbons/Ribbons";
import { organismeAtom } from "@/hooks/organismeAtoms";

import { DuplicateEffectifDetail } from "./models/DuplicateEffectifDetail";

const EffectifDoublonDeleteAlertDialog = ({
  isOpen,
  onClose = () => {},
  cancelRef,
  duplicateDetail,
  apprenantNomPrenom,
}: {
  isOpen: boolean;
  onClose?: () => void;
  cancelRef;
  duplicateDetail: DuplicateEffectifDetail;
  apprenantNomPrenom: string;
}) => {
  const queryClient = useQueryClient();
  const organisme = useRecoilValue<any>(organismeAtom);

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} size={"4xl"}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Suppression du duplicat d&apos;apprenant <b>{apprenantNomPrenom}</b>
          </AlertDialogHeader>

          <AlertDialogBody>
            Êtes vous sur.e de vouloir supprimer ce duplicat d&apos;apprenant ? <br />
            Cette opération est irréversible.
            <br />
            <Ribbons variant="alert" mt={10}>
              <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
                Attention, il vous faudra obligatoirement supprimer ce duplicat directement au sein de votre logiciel de
                gestion, dans le cas contraire un nouveau duplicat réapparaitra à la prochaine transmission de vos
                données !
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
                await _delete(`/api/v1/organismes/${organisme?._id}/duplicate/${duplicateDetail?.id}`);
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

export default EffectifDoublonDeleteAlertDialog;
