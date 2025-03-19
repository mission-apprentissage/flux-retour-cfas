import { Box, HStack, Text, Image, Button, Link as ChakraLink } from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";

import { Organisme } from "@/common/internal/Organisme";
import { usePlausibleTracking } from "@/hooks/plausible";
import Edition from "@/theme/components/icons/Edition";

import Link from "../Links/Link";

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

interface CerfaLinkProps {
  organisme: Organisme;
}
const CerfaLink = (props: CerfaLinkProps) => {
  const CERFA_URL = `https://contrat.apprentissage.beta.gouv.fr/cerfa`;

  const { trackPlausibleEvent } = usePlausibleTracking();
  const searchParams = useSearchParams();

  const buildUrlWithUtm = () => {
    const url = new URL(CERFA_URL);
    const utmSource = "tdb";
    const utmCampaign = searchParams?.get("utm_campaign");
    const utmContent = props.organisme._id;

    url.searchParams.set("utm_source", utmSource);
    url.searchParams.set("utm_content", utmContent);
    utmCampaign && url.searchParams.set("utm_campaign", utmCampaign);
    return url.toString();
  };

  const onLinkClicked = () => {
    trackPlausibleEvent("clic_redirection_cerfa", undefined, {
      uai: props.organisme?.uai?.toString() ?? "",
      siret: props.organisme.siret,
    });
  };

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
          <ChakraLink href={buildUrlWithUtm()} onClick={onLinkClicked} isExternal _hover={{ textDecoration: "none" }}>
            <Button variant="primary" padding={"8px 24px"} mr={1}>
              <Edition></Edition>
              <Text ml={2} style={buttonStyle}>
                Démarrer un contrat CERFA
              </Text>
            </Button>
          </ChakraLink>
          <HStack mt={3}>
            <Image src="/images/landing-cards/city-hall.svg" w={10} alt="" />
            <Text fontSize="omega">
              Vous formez un apprenti en contrat chez un employeur public ? Utilisez{" "}
              <Link href="https://celia.emploi.gouv.fr/" isExternal isUnderlined>
                CELIA
              </Link>
              .
            </Text>
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
};

export default CerfaLink;
