import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import NavLink from "next/link";
import PropTypes from "prop-types";
import React from "react";

import DemandeBranchementErpForm from "./DemandeBranchementErpForm";
import useSubmitDemandeBranchementErp, { SUBMIT_STATE } from "./useSubmitDemandeBranchementErp";

import { ERP_STATE } from "@/common/constants/erps";

const Message = ({ iconClassName, title, message }) => {
  return (
    <>
      <Flex fontWeight="700" fontSize="beta" color="grey.800" alignItems="center">
        <Box as="i" fontSize="alpha" textColor="bluefrance" className={iconClassName} />
        <Text paddingLeft="2w">{title}</Text>
      </Flex>
      <Text paddingX="6w" color="grey.800">
        {message}
      </Text>
      <HStack marginTop="10w" spacing="1w">
        <Box as="i" className="ri-arrow-left-line" />
        <NavLink href="/">Retourner à la page d&apos;accueil</NavLink>
      </HStack>
    </>
  );
};

Message.propTypes = {
  iconClassName: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
};

const DemandeBranchementErpFormBlock = () => {
  const { submitState, erpState, submitDemandeBranchementErp } = useSubmitDemandeBranchementErp();
  if (submitState === SUBMIT_STATE.success) {
    if (erpState === ERP_STATE.ongoing) {
      return (
        <Message
          iconClassName="ri-checkbox-circle-fill"
          title="Vos coordonnées ont bien été envoyées"
          message="Vous serez tenu informé de l’évolution des travaux d’interfaçage avec votre ERP."
        />
      );
    }
    if (erpState === ERP_STATE.coming || erpState === ERP_STATE.otherErp) {
      return (
        <Message
          iconClassName="ri-checkbox-circle-fill"
          title="Vos informations ont bien été envoyées"
          message="Vous serez tenu informé de l’évolution des travaux d’interfaçage avec votre ERP."
        />
      );
    }
    if (erpState === ERP_STATE.noErp) {
      return (
        <Message
          iconClassName="ri-checkbox-circle-fill"
          title="Vos informations ont bien été envoyées"
          message="Vous serez tenu informé de l’ouverture du nouveau service."
        />
      );
    }
  }

  if (submitState === SUBMIT_STATE.fail) {
    if (erpState === ERP_STATE.ongoing) {
      return (
        <Message
          iconClassName="ri-close-circle-fill"
          title="Nous avons rencontré une erreur lors de la soumission de vos coordonnées."
          message="Merci de réessayer ultérieurement."
        />
      );
    }
    return (
      <Message
        iconClassName="ri-close-circle-fill"
        title="Nous avons rencontré une erreur lors de la soumission de vos informations"
        message="Merci de réessayer ultérieurement."
      />
    );
  }

  return <DemandeBranchementErpForm onSubmit={submitDemandeBranchementErp} />;
};

export default DemandeBranchementErpFormBlock;
