import React, { useState, useEffect, createContext, useRef } from "react";
import { useRouter } from "next/router";
import { Box, Flex, Spinner, Text } from "@chakra-ui/react";

import { _get, _post, _put } from "../../common/httpClient";
import useAuth from "../../hooks/useAuth";
import useMaintenanceMessages from "../../hooks/useMaintenanceMessages";
import { emitter } from "../../common/emitter";
import { IAuthenticationContext } from "@/common/internal/AuthContext";
import { Cgu, CGU_VERSION } from "../legal/Cgu";
import AcknowledgeModal from "../Modals/AcknowledgeModal";

const AccountWrapper = ({ children }) => {
  const { auth, organisationType } = useAuth();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (auth) {
        if (auth.account_status === "PENDING_EMAIL_VALIDATION") {
          if (router.pathname !== "/auth/en-attente-confirmation" && router.pathname !== "/auth/confirmation") {
            router.push("/auth/en-attente-confirmation");
          }
        } else {
          if (
            (auth.account_status === "PENDING_PASSWORD_SETUP" ||
              auth.account_status === "DIRECT_PENDING_PASSWORD_SETUP") &&
            router.pathname !== "/auth/modifier-mot-de-passe" &&
            router.asPath !== "/en-maintenance"
          ) {
            let { token } = await _post("/api/v1/password/forgotten-password", { email: auth.email, noEmail: true });
            router.push(`/auth/modifier-mot-de-passe?passwordToken=${token}`);
          } else if (
            ["PENDING_PERMISSIONS_SETUP", "PENDING_ADMIN_VALIDATION"].includes(auth.account_status) &&
            router.asPath !== "/auth/finalisation" &&
            organisationType !== "ADMINISTRATEUR"
          ) {
            router.push("/auth/finalisation");
          }
        }
      }
    })();
  }, [auth, organisationType, router]);

  return <>{children}</>;
};

const ForceAcceptCGU = ({ children }) => {
  const { auth, refreshSession } = useAuth();
  const cguContainer = useRef(null);

  const onAcceptCguClicked = async () => {
    await _put("/api/v1/profile/cgu", {
      has_accept_cgu_version: CGU_VERSION,
    });
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
              isWrapped="1"
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
  const [isLoading, setIsLoading] = useState(!ssrAuth);
  const { messageMaintenance } = useMaintenanceMessages();

  useEffect(() => {
    (async () => {
      if (
        messageMaintenance?.enabled &&
        router.asPath !== "/en-maintenance" &&
        router.asPath !== "/auth/connexion" &&
        auth.organisation.type === "ADMINISTRATEUR"
      ) {
        router.push("/en-maintenance");
      }
    })();
  }, [auth, messageMaintenance?.enabled, router]);

  useEffect(() => {
    async function getUser() {
      try {
        const user = ssrAuth ?? (await _get("/api/v1/session"));
        setAuth(user);
      } catch (error) {
        setAuth(null);
      }
      setIsLoading(false);
    }
    if (!ssrAuth) {
      getUser();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onAPIResponseError = (response) => {
      if (response.status === 401) {
        //Auto logout user when token is invalid
        setAuth(null);
      }
    };
    emitter.on("http:error", onAPIResponseError);
    return () => {
      emitter.off("http:error", onAPIResponseError);
    };
  }, []);

  if (isLoading) {
    return (
      <Flex height="100vh" alignItems="center" justifyContent="center">
        <Spinner />
      </Flex>
    );
  }

  return (
    <AuthenticationContext.Provider value={{ auth, setAuth }}>
      <AccountWrapper>
        <ForceAcceptCGU>{children}</ForceAcceptCGU>
      </AccountWrapper>
    </AuthenticationContext.Provider>
  );
};

export default UserWrapper;
