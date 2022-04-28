import { Box, Modal, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

import { fetchReseaux, postCreateReseauCfa } from "../../../common/api/tableauDeBord";
import ModalClosingButton from "../../../common/components/ModalClosingButton/ModalClosingButton";
import CreateReseauCfaForm from "./CreateReseauCfaForm";

const CreateReseauCfaModal = ({ isOpen, onClose }) => {
  const { data } = useQuery(["reseaux"], () => fetchReseaux());
  const networkList = data;

  const queryClient = useQueryClient();
  const createReseauCfa = useMutation(
    (newReseauCfa) => {
      return postCreateReseauCfa(newReseauCfa);
    },
    {
      onSuccess() {
        queryClient.invalidateQueries(["reseauxCfas"]);
        onClose();
      },
    }
  );
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent borderRadius="0">
        <ModalHeader marginTop="2w" paddingX="8w" fontWeight="700" color="grey.800" fontSize="alpha" textAlign="left">
          <Box as="i" className="ri-arrow-right-line" marginRight="3v" verticalAlign="middle" />
          <Box as="span" verticalAlign="middle">
            Ajouter un CFA
          </Box>
        </ModalHeader>
        <ModalClosingButton />
        <CreateReseauCfaForm
          networkList={networkList}
          onSubmit={async (data) => {
            await createReseauCfa.mutateAsync(data);
          }}
        />
      </ModalContent>
    </Modal>
  );
};

CreateReseauCfaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CreateReseauCfaModal;
