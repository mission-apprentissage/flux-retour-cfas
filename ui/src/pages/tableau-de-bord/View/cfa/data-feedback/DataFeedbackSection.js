import { Box, Divider, Text, useDisclosure } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { formatDate } from "../../../../../common/utils/dateUtils";
import DataFeedbackModal from "./DataFeedbackModal";
import withDataFeedback from "./withDataFeedback";

const DataFeedbackInfo = ({ dataFeedback }) => {
  const icon = dataFeedback.donnee_est_valide ? "ri-checkbox-circle-fill" : "ri-error-warning-fill";
  const text = dataFeedback.donnee_est_valide
    ? `Les données affichées pour ce CFA ont été validées le ${formatDate(new Date(dataFeedback.created_at))}.`
    : `Les données affichées pour ce CFA ont été signalées comme incorrectes le ${formatDate(
        new Date(dataFeedback.created_at)
      )}.`;

  return (
    <Text color="grey.800">
      <Box as="i" className={icon} marginRight="1w" fontSize="gamma" verticalAlign="middle" />
      <Box as="span" verticalAlign="middle">
        {text}
      </Box>
    </Text>
  );
};

DataFeedbackInfo.propTypes = {
  dataFeedback: PropTypes.shape({
    donnee_est_valide: PropTypes.bool.isRequired,
    created_at: PropTypes.string.isRequired,
  }).isRequired,
};

const DataFeedbackModalInvitation = ({ siret, refetchDataFeedback }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Text color="grey.800">
        <strong>Votre centre de formation transmet ses données au tableau de bord.</strong>
        <br />
        Pour nous aider à construire un outil de qualité, vous pouvez&nbsp;
        <Box as="span" role="button" onClick={onOpen} textDecoration="underline" color="bluefrance" cursor="pointer">
          valider les données affichées ou signaler une anomalie
        </Box>
        .
      </Text>
      <DataFeedbackModal isOpen={isOpen} onClose={onClose} siret={siret} refetchDataFeedback={refetchDataFeedback} />
    </>
  );
};

DataFeedbackModalInvitation.propTypes = {
  siret: PropTypes.string.isRequired,
  refetchDataFeedback: PropTypes.func.isRequired,
};

const DataFeedbackSection = ({ dataFeedback, siret, refetchDataFeedback }) => {
  const content = dataFeedback ? (
    <DataFeedbackInfo dataFeedback={dataFeedback} />
  ) : (
    <DataFeedbackModalInvitation siret={siret} refetchDataFeedback={refetchDataFeedback} />
  );

  return (
    <Box as="section">
      {content}
      <Divider orientation="horizontal" borderColor="grey.300" marginTop="3w" />
    </Box>
  );
};

DataFeedbackSection.propTypes = {
  dataFeedback: PropTypes.shape({
    donnee_est_valide: PropTypes.bool.isRequired,
    created_at: PropTypes.string.isRequired,
  }),
  siret: PropTypes.string.isRequired,
  refetchDataFeedback: PropTypes.func.isRequired,
};

export default withDataFeedback(DataFeedbackSection);
