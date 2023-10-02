import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { ERPS_BY_ID } from "shared";

const ErpTutorial = ({ erp, ...rest }) => {
  return (
    <Box flexDirection="column" border="1px solid" borderColor="openbluefrance" p={6} {...rest}>
      <Heading as="h2" fontSize="2em">
        Tutoriel pour {ERPS_BY_ID[erp]?.name}
      </Heading>
      <Text mt={5}>
        Une fois votre clé générée et copiée, <br />
        veuillez la coller dans votre compte ERP.
        <br />
        Ci-dessous, voyez comment procéder.
      </Text>

      {ERPS_BY_ID[erp]?.helpFilePath && (
        <Stack mt={5}>
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
              window.open(ERPS_BY_ID[erp]?.helpFilePath, "_blank");
            }}
            leftIcon={<ArrowForwardIcon />}
          >
            Lire le tutoriel
          </Button>
          {ERPS_BY_ID[erp]?.helpFileSize && (
            <Text color="grey.600" fontSize={"xs"}>
              PDF – {ERPS_BY_ID[erp]?.helpFileSize}
            </Text>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default ErpTutorial;
