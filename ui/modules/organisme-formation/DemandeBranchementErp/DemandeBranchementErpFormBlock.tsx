import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import NavLink from "next/link";
import React from "react";
import { ERP_STATE } from "shared";

import DemandeBranchementErpForm from "./DemandeBranchementErpForm";
import useSubmitDemandeBranchementErp, { SUBMIT_STATE } from "./useSubmitDemandeBranchementErp";

const Message = ({ iconClassName, title, message }: { iconClassName: string; title: string; message: string }) => {
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
