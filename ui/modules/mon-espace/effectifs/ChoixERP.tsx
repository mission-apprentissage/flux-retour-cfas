import { Box, Button, RadioGroup, Radio, Text, VStack, HStack } from "@chakra-ui/react";
import { useFormik } from "formik";
import { useRouter } from "next/router";
import React from "react";
import { ERPS } from "shared";
import * as Yup from "yup";

import { configureOrganismeERP } from "@/common/api/tableauDeBord";
import Ribbons from "@/components/Ribbons/Ribbons";
import { InfoCircle } from "@/theme/components/icons/index";

const ChoixERP = ({ organisme, isMine }) => {
  const router = useRouter();

  const { values, handleSubmit, handleChange, isSubmitting } = useFormik({
    initialValues: {
      erp: organisme?.erps?.[0] || "",
    },
    validationSchema: Yup.object().shape({
      erp: Yup.string().required("Requis"),
    }),
    onSubmit: async (submittedValues) => {
      if (submittedValues.erp === "SCFORM") {
        await configureOrganismeERP(organisme._id, {
          erps: ["SCFORM"],
          setup_step_courante: "COMPLETE",
          mode_de_transmission: "API",
        });
        router.push("/mon-compte/erp");
      } else {
        router.push(
          isMine
            ? `/effectifs/aide-configuration-erp?erp=${submittedValues.erp}`
            : `/organismes/${organisme._id}/effectifs/aide-configuration-erp?erp=${submittedValues.erp}`
        );
      }
    },
  });
  return (
    <form onSubmit={handleSubmit}>
      <VStack width={["100%", "100%", "100%", "100%"]} mt={5} mb={10} alignItems="baseline">
        <Text fontWeight="700" color="bluefrance_light" fontSize="3xl">
          Importer vos effectifs
        </Text>
        <HStack spacing={4} alignItems="flex-start" mt={6}>
          <VStack backgroundColor="openbluefrance" spacing={4} p={2} alignItems="baseline">
            <Text fontWeight="700" color="bluefrance_light" fontSize="xl">
              Quel ERP ou outil de gestion utilise votre organisme de formation ?
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
                    await configureOrganismeERP(organisme._id, {
                      mode_de_transmission: "MANUEL",
                      setup_step_courante: "COMPLETE",
                    });
                    window.location.reload(); // FIXME, il faudrait refetch l'organisme
                  }}
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
                await configureOrganismeERP(organisme._id, { mode_de_transmission: null });
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
          <VStack gap={2} alignItems="baseline" maxWidth={400}>
            <Ribbons>
              Un ERP (Enterprise Ressource Planning ou PGI pour Progiciel de Gestion Intégré) est une solution
              logicielle qui permet d’unifier le système d’information d’une entreprise autour d’une base de données
              unique.Pour un organisme de formation, la plupart des ERP proposent des fonctionnalités telles que la
              gestion et le suivi des apprenants, la gestion des plannings de formation, la gestion des formateurs,
              parfois la facturation, etc.
            </Ribbons>
            <Ribbons>
              Vous aurez la possibilité de combiner deux moyens d’importation mais vous devez les programmer un à la
              fois.
            </Ribbons>
          </VStack>
        </HStack>
      </VStack>
    </form>
  );
};

export default ChoixERP;
