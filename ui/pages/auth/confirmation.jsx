import { Box, Flex, Heading, HStack, Spinner } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { _post } from "../../common/httpClient";
import decodeJWT from "../../common/utils/decodeJWT";
import { decodeJwt } from "jose";
import useAuth from "../../hooks/useAuth";
import useToken from "../../hooks/useToken";
import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";
import { useQuery } from "@tanstack/react-query";

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
      <Flex minH="50vh" justifyContent="start" mt="10" flexDirection="column">
        <HStack>
          <Spinner mr={3} />
          <Heading fontSize="1rem" fontFamily="Marianne" fontWeight="500" marginBottom="2w">
            {title}
          </Heading>
        </HStack>
      </Flex>
    );

  return (
    <Flex minH="50vh" justifyContent="start" mt="10" flexDirection="column">
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
