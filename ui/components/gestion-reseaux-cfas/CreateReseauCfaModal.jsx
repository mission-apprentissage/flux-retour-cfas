import { Box, Modal, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchReseaux, postCreateReseauCfa } from "../../common/api/tableauDeBord";
import ModalClosingButton from "../ModalClosingButton/ModalClosingButton";
import { QUERY_KEYS } from "../../common/constants/queryKeys";
import CreateReseauCfaForm from "./CreateReseauCfaForm";

const CreateReseauCfaModal = ({ isOpen, onClose }) => {
  const { data } = useQuery([QUERY_KEYS.RESEAUX], () => fetchReseaux());
  const networkList = data;

  const queryClient = useQueryClient();
  const createReseauCfa = useMutation(
    (newReseauCfa) => {
      return postCreateReseauCfa(newReseauCfa);
    },
    {
      onSuccess() {
        queryClient.invalidateQueries([QUERY_KEYS.SEARCH_RESEAUX_CFA]);
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
            Ajouter un CFA à un réseau
          </Box>
        </ModalHeader>
        <ModalClosingButton />
        <CreateReseauCfaForm
          networkList={networkList}
          createReseauCfa={async (data) => {
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
