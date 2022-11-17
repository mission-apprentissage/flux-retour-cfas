import React, { useState, useEffect } from "react";
import { Box, Flex, Center, Container, Spinner } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useRecoilValue } from "recoil";

// import useAuth from "../../hooks/useAuth";
// import { hasPageAccessTo } from "../../common/utils/rolesUtils";

// import { CerfaForm } from "./cerfaForm/CerfaForm";
import { useCerfa } from "./formEngine/useCerfa";
import { cerfaSchema } from "./formEngine/cerfaSchema";
import { CerfaControllerContext } from "./formEngine/CerfaControllerContext";
import { dossierCompletionStatus } from "./atoms";
import { useInitCerfa } from "./formEngine/hooks/useInitCerfa";
import { useAutoSave } from "./formEngine/hooks/useAutoSave";
import { useDossier } from "./hooks/useDossier";

const Dossier = () => {
  const router = useRouter();
  // TODO BETTER GETTER SLUGS
  const { slug } = router.query;
  const dossierIdParam = slug?.[slug.length - 2];
  const paramstep = slug?.[slug.length - 1];

  // let [auth] = useAuth();

  const { isloaded, dossier } = useDossier(dossierIdParam);
  const { controller: cerfaController } = useCerfa({ schema: cerfaSchema });
  const { isLoading } = useInitCerfa({ controller: cerfaController });
  useAutoSave({ controller: cerfaController });

  const [documentsComplete, setDocumentsComplete] = useState(false);
  // const { signaturesCompletion, sca, setSignaturesCompletion } = useSignatures();
  const [signaturesComplete, setSignaturesComplete] = useState(false);

  const dossierStatus = useRecoilValue(dossierCompletionStatus);
  const cerfaComplete = dossierStatus?.cerfa?.complete;
  const cerfaCompletion = dossierStatus?.cerfa?.completion;
  const documentsCompletion = dossierStatus?.documents?.completion;
  const signatureCompletion = dossierStatus?.signature?.completion;
  const { signaturesCompletion, sca, setSignaturesCompletion } = {
    signaturesCompletion: signatureCompletion,
    sca: signatureCompletion,
  };

  useEffect(() => {
    const run = async () => {
      if (documentsCompletion !== null && signaturesCompletion !== null) {
        const documentsCompleteTmp = documentsCompletion === 100;
        const signaturesCompleteTmp = sca === 100;

        setDocumentsComplete(documentsCompleteTmp);
        setSignaturesComplete(signaturesCompleteTmp);
      }
    };
    run();
  }, [
    dossierStatus,
    documentsComplete,
    documentsCompletion,
    dossier,
    router,
    isloaded,
    paramstep,
    setSignaturesCompletion,
    signaturesComplete,
    signaturesCompletion,
    sca,
    cerfaCompletion,
    cerfaComplete,
  ]);

  if (!isloaded || isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  // TODO not Authorize handler

  return (
    <CerfaControllerContext.Provider value={cerfaController}>
      <Box w="100%" px={[1, 1, 6, 6]} mb={10}>
        <Container maxW="xl">
          <Flex flexDir="column" width="100%" mt={9}>
            {/* <CerfaForm /> */}
          </Flex>
        </Container>
      </Box>
    </CerfaControllerContext.Provider>
  );
};

export default Dossier;
