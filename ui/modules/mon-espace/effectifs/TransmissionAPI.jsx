import React from "react";
import { Box, Button, Flex, RadioGroup, Radio, Text, VStack } from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/router";

import { InfoCircle } from "../../../theme/components/icons/index.js";
import { ERPS } from "../../../common/constants/erps";
import { useOrganisationOrganisme } from "../../../hooks/organismes";
import { configureOrganisationERP } from "../../../common/api/tableauDeBord.js";

const TransmissionAPI = () => {
  const { organisme } = useOrganisationOrganisme();
  const router = useRouter();

  const { values, handleSubmit, handleChange, isSubmitting } = useFormik({
    initialValues: {
      erp: organisme?.erps?.[0] || "",
    },
    validationSchema: Yup.object().shape({
      erp: Yup.string().required("Requis"),
    }),
    onSubmit: async (submittedValues) => {
      router.push(`/effectifs/aide-configuration-erp?erp=${submittedValues.erp}`);
    },
  });
  return (
    <form onSubmit={handleSubmit}>
      <Flex width={["100%", "100%", "100%", 792]} mt={5} mb={10} flexDirection="column">
        <Text fontWeight="700" color="bluefrance_light" fontSize="3xl">
          Transmettre vos effectifs au tableau de bord
        </Text>
        <Text color="grey.800">Pour transmettre vos effectifs, laissez-vous guider.</Text>
        <VStack backgroundColor="openbluefrance" spacing={4} p={2} mt={6} alignItems={"baseline"}>
          <Text fontWeight="700" color="bluefrance_light" fontSize="xl">
            Quel outil de gestion utilise votre organisme de formation ?
          </Text>
          <RadioGroup id="erp" name="erp">
            <VStack spacing={2} p={2}>
              {ERPS.filter((o) => o.state === "ready").map(({ id, name }) => (
                <Box key={id} backgroundColor="white" border="1px" p={3} w={300}>
                  <Radio value={id} onChange={handleChange}>
                    {name}
                  </Radio>
                </Box>
              ))}

              <Box backgroundColor="white" border="1px" p={2} w={300}>
                <Radio value="other" onChange={handleChange}>
                  Un outil différent de ceux-là
                  <Text color="mgalt" fontSize="sm">
                    (Excel, Salesforce, Hubspot, Sheets ...)
                  </Text>
                </Radio>
              </Box>
            </VStack>
          </RadioGroup>
          {values.erp === "other" ? (
            <>
              <Text color="flatsuccess">
                <InfoCircle />
                Transmettez facilement vos données grâce à notre service dédié.
              </Text>

              <Button
                variant="primary"
                onClick={async () => {
                  await configureOrganisationERP({
                    mode_de_transmission: "MANUEL",
                    setup_step_courante: "COMPLETE",
                  });
                  window.location.reload(); // FIXME, il faudrait refetch l'organisme
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                J’accède au service
              </Button>
            </>
          ) : (
            <Button type="submit" variant="primary" isLoading={isSubmitting} isDisabled={isSubmitting || !values.erp}>
              Démarrer l’interfaçage
            </Button>
          )}

          <Button
            onClick={async () => {
              await configureOrganisationERP({ mode_de_transmission: null });
              window.location.reload(); // FIXME, il faudrait refetch l'organisme
            }}
            color="bluefrance"
            variant={"link"}
            padding={2}
          >
            <Box as="i" className="ri-arrow-left-line" />
            Retour à l’étape précédente
          </Button>
        </VStack>
      </Flex>
    </form>
  );
};

export default TransmissionAPI;
