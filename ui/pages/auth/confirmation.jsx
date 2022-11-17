import { CloseIcon } from "@chakra-ui/icons";
import { Box, Flex, Heading, HStack, Spinner } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { decodeJwt } from "jose";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

import { _post } from "../../common/httpClient";
import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";
import decodeJWT from "../../common/utils/decodeJWT";
import useAuth from "../../hooks/useAuth";
import useToken from "../../hooks/useToken";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

function useActivation(activationToken) {
  const { data, isLoading, isFetching, isError } = useQuery(
    ["useActivation"],
    () => _post("/api/v1/auth/activation", { activationToken }),
    {
      refetchOnWindowFocus: false,
    }
  );

  return {
    data,
    isLoading,
    isFetching,
    isError,
  };
}

const Confirmed = () => {
  const router = useRouter();
  const [, setAuth] = useAuth();
  const [, setToken] = useToken();
  const { activationToken } = router.query;
  const email = decodeJWT(activationToken).sub;

  const { isLoading, isError, data } = useActivation(activationToken);

  useEffect(() => {
    const run = async () => {
      if (!isLoading && data) {
        if (data.succeeded) {
          const user = decodeJwt(data.token);
          setAuth(user);
          setToken(data.token);
        }
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isLoading]);

  const title = `Confirmation du compte pour l'utilisateur ${email}`;

  if (isLoading)
    return (
      <Flex minHeight="50vh" justifyContent="start" marginTop="10" flexDirection="column">
        <HStack>
          <Spinner marginRight={3} />
          <Heading fontSize="1rem" fontFamily="Marianne" fontWeight="500" marginBottom="2w">
            {title}
          </Heading>
        </HStack>
      </Flex>
    );

  return (
    <Flex minHeight="50vh" justifyContent="start" marginTop="10" flexDirection="column">
      {isError && (
        <HStack>
          <CloseIcon aria-hidden={true} color="error" cursor="pointer" />
          <Heading fontSize="1rem" fontFamily="Marianne" fontWeight="500" marginBottom="2w" color="error">
            Le lien est expiré ou invalide, merci de prendre contact avec un administrateur en précisant votre adresse
            mail :
          </Heading>
          <Box>
            {/* TODO */}
            <a href="mailto:cerfa@apprentissage.beta.gouv.fr">support-contrat@apprentissage.beta.gouv.fr</a>
          </Box>
        </HStack>
      )}
    </Flex>
  );
};

export default Confirmed;
