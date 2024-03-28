import { Box, HStack, Text, Image, Button, Link } from "@chakra-ui/react";

import Edition from "@/theme/components/icons/Edition";

const style = {
  width: "330px",
  maxWidth: "330px",
  borderRadius: "8px",
  opacity: 0.8,
  padding: "16px",
  background:
    "linear-gradient(282deg, #FCEEAC 0%, #FFE4B9 9.5%, #FFDFCD 21.5%, #FFDEE1 27.5%, #FFE1EE 38%, #FDE3F4 46%, #FBE6FA 55%, #F8E9FF 63.5%, #F3EAFF 72%, #EFEBFF 82%, #EBECFF 91.5%, #EFEBFF 100%)",
  boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25), 0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
};

const titleStyle = {
  color: "#0063CB",
  fontSize: "16px",
  fontWeight: 700,
};

const contentStyle = {
  color: "#161616",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "24px",
};

const buttonStyle = {
  color: "#F5F5FE",
  fontSize: "16px",
  fontWeight: 500,
};

const CerfaLink = () => {
  return (
    <Box style={style}>
      <HStack>
        <Box>
          <HStack mb={"12px"}>
            <Image flex={1} src="/images/cerfa/avatar.svg" alt="Logo République française" userSelect="none" />
            <Text flex={8} style={titleStyle}>
              {" "}
              Un contrat d&apos;apprentissage ?
            </Text>
          </HStack>
          <Text mb={"12px"} fontSize={14} style={contentStyle}>
            Remplissez vos prochains contrats CERFA : simple, rapide et sans erreur.
          </Text>
          <Link href="https://contrat.apprentissage.beta.gouv.fr/" isExternal>
            <Button variant="primary" padding={"8px 24px"} mr={1}>
              <Edition></Edition>
              <Text ml={2} style={buttonStyle}>
                Démarrer un contrat CERFA
              </Text>
            </Button>
          </Link>
        </Box>
      </HStack>
    </Box>
  );
};

export default CerfaLink;
