import { Box, Button, Flex, RadioGroup, Radio, Text, VStack, Stack, HStack } from "@chakra-ui/react";
import { useFormik } from "formik";
import { useRouter } from "next/router";
import React from "react";
import { ERPS } from "shared";

import { configureOrganismeERP } from "@/common/api/tableauDeBord";
import { DownloadLine } from "@/theme/components/icons/index";

type ConfigurationAPIProps = {
  organismeId: string;
  isMine: boolean;
  erpIdSelected: string | null | undefined;
};

const ConfigurationAPI = ({ organismeId, isMine, erpIdSelected }: ConfigurationAPIProps) => {
  const router = useRouter();

  const erpSelected = ERPS.find((e) => e.id === erpIdSelected);
  const erpName = erpSelected?.name;

  const { values, handleChange } = useFormik({
    initialValues: { doYouUseAnotherService: "" },
    onSubmit: async () => {
      // DO NOTHING
    },
  });

  return (
    <form>
      <Flex width={["100%", "100%", "100%", 792]} mt={5} mb={10} flexDirection="column" alignItems="left" gap={6}>
        <Text fontWeight="700" color="bluefrance_light" fontSize="3xl">
          Démarrer l’interfaçage avec [{erpName}].
        </Text>

        {erpSelected?.helpFilePath && (
          <Stack>
            <Button
              variant="link"
              alignSelf="flex-start"
              borderBottomColor="bluefrance"
              borderBottomStyle="solid"
              borderBottomWidth={1.5}
              borderRadius={0}
              display={"flex"}
              padding={"2px"}
              alignItems="end"
              onClick={async () => {
                await configureOrganismeERP(organismeId, {
                  setup_step_courante: "STEP2",
                  erps: [erpIdSelected],
                });
                window.open(erpSelected.helpFilePath, "_blank");
              }}
            >
              Télécharger le pas-à-pas {erpName}
              <DownloadLine color="bluefrance" marginBottom={"8px"} marginLeft={"8px"} fontSize={"xs"} />
            </Button>
            {erpSelected.helpFileSize && (
              <Text color="grey.600" fontSize={"xs"}>
                PDF – {erpSelected.helpFileSize}
              </Text>
            )}
          </Stack>
        )}

        <Text color="grey.800">
          <b>Temps estimé :</b> 5 minutes
        </Text>
        <Box color="grey.800">
          <b>Pré-requis :</b>
          <p>
            La configuration doit être effectuée par un administrateur sur {erpName}. Votre logiciel {erpName} doit être
            à jour. Vous devez avoir renseigné votre UAI dans {erpName}.
          </p>
        </Box>
        <VStack backgroundColor="openbluefrance" spacing={4} p={2} mt={6} alignItems={"baseline"}>
          <Text fontWeight="700" color="bluefrance_light" fontSize="xl">
            Utilisez-vous un autre outil de gestion de vos effectifs au quotidien ?
          </Text>
          <RadioGroup id="doYouUseAnotherService" name="doYouUseAnotherService">
            <VStack spacing={8} p={2} alignItems={"baseline"}>
              <VStack alignItems={"baseline"}>
                <Box backgroundColor="white" border="1px" p={3} w={300}>
                  <Radio value="yes" onChange={handleChange}>
                    Oui
                  </Radio>
                </Box>
                {values.doYouUseAnotherService === "yes" && (
                  <HStack color="flatsuccess" alignItems={"baseline"}>
                    <i className="ri-checkbox-circle-line" />
                    <Text>
                      Il est possible de transmettre une partie de vos effectifs via votre ERP et d’importer l’autre
                      partie via l’onglet “Mes effectifs”. Si vous utilisez deux ERP connectés au tableau de bord
                      (exemple : Yparéo et SC Form), veuillez nous contacter.
                    </Text>
                  </HStack>
                )}
              </VStack>
              <VStack alignItems={"baseline"}>
                <Box backgroundColor="white" border="1px" p={3} w={300}>
                  <Radio value="no" onChange={handleChange}>
                    Non, {erpName} est mon unique outil de gestion
                  </Radio>
                </Box>
                {values.doYouUseAnotherService === "no" && (
                  <HStack color="flatsuccess" alignItems={"baseline"}>
                    <i className="ri-checkbox-circle-line" />
                    <Text>Vous pouvez télécharger le pas-à-pas disponible ci-dessus.</Text>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </RadioGroup>
        </VStack>
        <Button
          onClick={async () => {
            await configureOrganismeERP(organismeId, {
              erps: [erpIdSelected],
              setup_step_courante: "COMPLETE",
              mode_de_transmission: "API",
            });
            router.push(isMine ? "/effectifs" : `/organismes/${organismeId}/effectifs`);
          }}
          variant="secondary"
          padding={2}
        >
          J&rsquo;ai terminé de configurer mon {erpName}
        </Button>
      </Flex>
    </form>
  );
};

export default ConfigurationAPI;
