import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Heading, Container, Text, FormControl, FormLabel, Input, Box, Button, VStack } from "@chakra-ui/react";
import { Form, Formik, useFormik } from "formik";
import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";

import { _post, _put, _delete } from "@/common/httpClient";
import SimplePage from "@/components/Page/SimplePage";

// pas de SSR ici car localStorage

function TestERP() {
  const [configTestERP, setConfigTestERP] = useLocalStorage("tdb-config-test-erp", {
    siret: "",
    uai: "",
    erp: "",
    api_key: "",
  });

  const { values, handleChange } = useFormik({
    initialValues: configTestERP,
    onSubmit: () => {},
  });

  // sauvegarde l'état du form dans le local storage
  useEffect(() => {
    setConfigTestERP(values);
  }, [JSON.stringify(values)]);

  const title = "Test d’ERP";
  return (
    <SimplePage title={title}>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={8}>
          {title}
        </Heading>

        <Text>
          Cette page reproduit l’intégration et le paramétrage réalisés côté ERP pour l’authentification à l’API v3 du
          TDB.
        </Text>
        <Text mt={4}>
          Cette page est publique et vous n’avez pas besoin d’être authentifié pour y accéder. Si vous l’êtes, il faudra
          appartenir à un OFA pour que le process fonctionne correctement.
        </Text>

        <Box maxW="fit-content" mt={8}>
          <Formik initialValues={configTestERP} validateOnMount onSubmit={() => {}}>
            <Form>
              <VStack alignItems="start" gap={4}>
                <Text fontSize="delta" fontWeight="bold">
                  1. Configuration de l’organisme
                </Text>

                <FormControl isRequired>
                  <FormLabel>SIRET</FormLabel>
                  <Input
                    id="siret"
                    name="siret"
                    value={values.siret}
                    onChange={handleChange}
                    placeholder="Exemple : 98765432400019"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>UAI</FormLabel>
                  <Input
                    id="uai"
                    name="uai"
                    value={values.uai}
                    onChange={handleChange}
                    placeholder="Exemple : 1234567A"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>ERP</FormLabel>
                  <Input id="erp" name="erp" value={values.erp} onChange={handleChange} placeholder="Exemple : ymag" />
                </FormControl>

                <Button
                  variant="primary"
                  isDisabled={!values.siret || !values.uai || !values.erp}
                  onClick={() => {
                    window.open(
                      `${location.origin}/connexion-api?siret=${values.siret}&uai=${values.uai}&erp=${values.erp}`,
                      "_blank"
                    );
                  }}
                >
                  Connecter au tableau de bord
                  <ExternalLinkIcon ml={2} />
                </Button>

                <Text fontSize="delta" fontWeight="bold">
                  2. Configuration de la clé d’API
                </Text>

                <FormControl isRequired>
                  <FormLabel>Clé d’API</FormLabel>
                  <Input
                    id="api_key"
                    name="api_key"
                    value={values.api_key}
                    onChange={handleChange}
                    placeholder="Exemple : 00000000-0000-0000-0000-00000000000"
                  />
                </FormControl>

                <Button
                  variant="primary"
                  isDisabled={!values.siret || !values.uai || !values.erp || !values.api_key}
                  onClick={() => {
                    window.open(
                      `${location.origin}/connexion-api?siret=${values.siret}&uai=${values.uai}&erp=${values.erp}&api_key=${values.api_key}`,
                      "_blank"
                    );
                  }}
                >
                  Valider votre connexion au tableau de bord
                  <ExternalLinkIcon ml={2} />
                </Button>
              </VStack>
            </Form>
          </Formik>
        </Box>
      </Container>
    </SimplePage>
  );
}
export default TestERP;
