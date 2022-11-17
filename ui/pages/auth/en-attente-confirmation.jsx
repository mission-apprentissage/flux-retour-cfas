import { Flex, Heading, HStack, Spinner } from "@chakra-ui/react";
import React from "react";

import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const WaitingConfirmationPage = () => {
  return (
    <Flex minHeight="50vh" justifyContent="start" marginTop="10" flexDirection="column">
      <HStack>
        <Spinner marginRight={3} />
        <Heading fontSize="1rem" fontFamily="Marianne" fontWeight="500" marginBottom="2w">
          En attente de confirmation votre compte utilisateur. Merci de vérifier vos emails.
        </Heading>
      </HStack>
    </Flex>
  );
};

export default WaitingConfirmationPage;
