import { Box, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useState, useEffect, createContext, useRef } from "react";

import { emitter } from "@/common/emitter";
import { _get, _put } from "@/common/httpClient";
import { IAuthenticationContext } from "@/common/internal/AuthContext";
import { Cgu, CGU_VERSION } from "@/components/legal/Cgu";
import AcknowledgeModal from "@/components/Modals/AcknowledgeModal";
import useAuth from "@/hooks/useAuth";
import useMaintenanceMessages from "@/hooks/useMaintenanceMessages";

const ForceAcceptCGU = ({ children }) => {
  const { auth, refreshSession } = useAuth();
  const cguContainer = useRef(null);

  const onAcceptCguClicked = async () => {
    await _put(`/api/v1/profile/cgu/accept/${CGU_VERSION}`);
    await refreshSession();
  };

  return (
    <>
      {auth && auth.account_status === "CONFIRMED" && (
        <AcknowledgeModal
          title="Conditions générales d'utilisation"
          acknowledgeText="Accepter"
          isOpen={auth.has_accept_cgu_version !== CGU_VERSION}
          onAcknowledgement={onAcceptCguClicked}
          canBeClosed={false}
          bgOverlay="rgba(0, 0, 0, 0.28)"
          size="full"
        >
          <Box mb={3}>
            {!auth.has_accept_cgu_version && (
              <Text fontSize="1.1rem" fontWeight="bold">
                Merci de lire attentivement les conditions générales d&apos;utilisation avant de les accepter.
              </Text>
            )}
            {auth.has_accept_cgu_version && (
              <Text fontSize="1.1rem" fontWeight="bold">
                Nos conditions générales d&apos;utilisation ont changé depuis votre dernières visite. (
                {auth.has_accept_cgu_version} -&gt; {CGU_VERSION}) <br />
                <br />
                Merci de lire attentivement les conditions générales d&apos;utilisation avant de les accepter.
              </Text>
            )}
          </Box>
          <Box borderColor={"dgalt"} borderWidth={1} overflowY="scroll" px={15} py={4} ref={cguContainer}>
            <Cgu
              isWrapped
              onLoad={async () => {
                await new Promise((resolve) => setTimeout(resolve, 500));
                (cguContainer.current as any)?.scrollTo(0, 0);
              }}
            />
          </Box>
        </AcknowledgeModal>
      )}
      {children}
    </>
  );
};

export const AuthenticationContext = createContext<IAuthenticationContext>({} as any);

const UserWrapper = ({ children, ssrAuth }) => {
  const [auth, setAuth] = useState(ssrAuth);
  const router = useRouter();
  // const [isLoading, setIsLoading] = useState(!ssrAuth);
  const { messageMaintenance } = useMaintenanceMessages();

  useEffect(() => {
    // 1) Si pas de message de maintenance, on arrête tout de suite
    if (!messageMaintenance?.enabled) return;

    // 2) On ne redirige pas si on est déjà sur la page maintenance ou connexion
    const skipPaths = ["/en-maintenance", "/auth/connexion"];
    if (skipPaths.includes(router.asPath)) return;

    // 3) Seuls les admins sont concernés
    if (auth && auth.organisation.type !== "ADMINISTRATEUR") return;

    // 4) On redirige
    router.push("/en-maintenance");
  }, [auth, messageMaintenance?.enabled, router]);

  useEffect(() => {
    // Si on a déjà la session en SSR, on l’applique tout de suite
    if (ssrAuth) {
      setAuth(ssrAuth);
      // setIsLoading(false);
      return;
    }

    // Sinon, on la récupère côté client
    const fetchUser = async () => {
      try {
        const user = await _get("/api/v1/session");
        setAuth(user);
      } catch {
        setAuth(null);
      } finally {
        // setIsLoading(false);
      }
    };

    fetchUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleHttpError = ({ status }: { status: number }) => status === 401 && setAuth(null);

    emitter.on("http:error", handleHttpError);

    return () => {
      emitter.off("http:error", handleHttpError);
    };
  }, [setAuth]);

  // if (isLoading) {
  //   return (
  //     <Flex height="100vh" alignItems="center" justifyContent="center">
  //       <Spinner />
  //     </Flex>
  //   );
  // }

  return (
    <AuthenticationContext.Provider value={{ auth, setAuth }}>
      <ForceAcceptCGU>{children}</ForceAcceptCGU>
    </AuthenticationContext.Provider>
  );
};

export default UserWrapper;
