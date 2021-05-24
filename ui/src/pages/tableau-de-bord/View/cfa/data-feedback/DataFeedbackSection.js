import { Box, Divider, Flex, Link, Text, useDisclosure } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { formatDate } from "../../../../../common/utils/dateUtils";
import DataFeedbackModal from "./DataFeedbackModal";
import ValidationStateBadge from "./ValidationStateBadge";
import withDataFeedback from "./withDataFeedback";

const DataValidated = ({ date }) => {
  return (
    <Flex justifyContent="space-between">
      <Text color="grey.800">
        <Box as="i" className="ri-checkbox-circle-fill" marginRight="1w" fontSize="gamma" verticalAlign="middle" />
        <Box as="span" verticalAlign="middle">
          Les données affichées pour cet organisme de formation ont été validées le {formatDate(new Date(date))}.
        </Box>
      </Text>
      <span>
        <ValidationStateBadge>Données validées</ValidationStateBadge>
      </span>
    </Flex>
  );
};

DataValidated.propTypes = {
  date: PropTypes.string.isRequired,
};

const DataInvalidated = ({ date }) => {
  return (
    <Flex justifyContent="space-between">
      <Text color="grey.800">
        <Box as="i" className="ri-error-warning-fill" marginRight="1w" fontSize="gamma" verticalAlign="middle" />
        <Box as="span" verticalAlign="middle">
          Les données affichées pour cet organisme de formation ont été signalées comme incorrectes le{" "}
          {formatDate(new Date(date))}.
        </Box>
      </Text>
      <span>
        <ValidationStateBadge>Données invalidées</ValidationStateBadge>
      </span>
    </Flex>
  );
};

DataInvalidated.propTypes = {
  date: PropTypes.string.isRequired,
};

const AwaitingDataFeedback = ({ siret, refetchDataFeedback }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Flex justifyContent="space-between">
        <Text color="grey.800" fontSize="zeta">
          <strong>Votre organisme de formation transmet ses données au tableau de bord.</strong>
          <br />
          Pour nous aider à construire un outil de qualité, vous pouvez&nbsp;
          <Box as="span" role="button" onClick={onOpen} textDecoration="underline" color="bluefrance" cursor="pointer">
            valider les données affichées ou signaler une anomalie
          </Box>
          .
        </Text>
        <span>
          <ValidationStateBadge fullOpacity={false}>Données en attente de validation</ValidationStateBadge>
        </span>
      </Flex>
      <Link
        href="https://mission-apprentissage.gitbook.io/general/de-nouveaux-outils-pour-lecosysteme/tableau-de-bord-comprendre-les-donnees"
        rel="noopener noreferrer"
        target="_blank"
        color="bluefrance"
        fontSize="zeta"
      >
        Consultez la FAQ
      </Link>
      <DataFeedbackModal isOpen={isOpen} onClose={onClose} siret={siret} refetchDataFeedback={refetchDataFeedback} />
    </>
  );
};

AwaitingDataFeedback.propTypes = {
  siret: PropTypes.string.isRequired,
  refetchDataFeedback: PropTypes.func.isRequired,
};

const DataFeedbackSection = ({ dataFeedback, siret, refetchDataFeedback }) => {
  let content;

  if (!dataFeedback) content = <AwaitingDataFeedback siret={siret} refetchDataFeedback={refetchDataFeedback} />;
  else {
    content = dataFeedback.donnee_est_valide ? (
      <DataValidated date={dataFeedback.created_at} />
    ) : (
      <DataInvalidated date={dataFeedback.created_at} />
    );
  }

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
