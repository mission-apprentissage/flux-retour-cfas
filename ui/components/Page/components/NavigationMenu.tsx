import { ChevronDownIcon, SettingsIcon } from "@chakra-ui/icons";
import { Box, Container, Flex, Menu, MenuButton, MenuItem, MenuList, Text, Tooltip } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ReactElement, useState } from "react";

import { CONTACT_ADDRESS } from "@/common/constants/product";
import { AuthContext } from "@/common/internal/AuthContext";
import { OrganisationType } from "@/common/internal/Organisation";
import Link from "@/components/Links/Link";
import { useOrganisationOrganisme } from "@/hooks/organismes";
import { usePlausibleTracking } from "@/hooks/plausible";
import useAuth from "@/hooks/useAuth";
import { useEffectifsOrganisme } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";
import { Close, MenuFill, ParentGroupIcon } from "@/theme/components/icons";

function getMesOrganismesLabelFromOrganisationType(type: OrganisationType): string {
  switch (type) {
    case "ORGANISME_FORMATION":
      return "Mes organismes";

    case "TETE_DE_RESEAU":
      return "Mon réseau";

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DRAFPIC":
    case "DDETS":
    case "ACADEMIE":
      return "Mon territoire";

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return "Tous les organismes";

    default:
      throw new Error(`Type '${type}' inconnu`);
  }
}

const NavItem = ({
  children,
  to = "/",
  colorActive = "bluefrance",
  isActive = false,
  isDisabled = false,
  disabledReason = "",
  colorDisabled = "dgalt",
  exactMatch = false,
  ...rest
}) => {
  const router = useRouter();
  const isActiveInternal =
    isActive || exactMatch
      ? router.pathname === to || router.asPath === to
      : router.pathname.startsWith(to) || router.asPath.startsWith(to);

  const hasState = isActiveInternal || isDisabled;
  const colorCurrentState = isActiveInternal ? colorActive : isDisabled ? colorDisabled : "";

  const Component = isDisabled ? Box : Link;
  const TextComponent = isDisabled && disabledReason ? Tooltip : Text;

  return (
    <Component
      p={4}
      href={to}
      color={hasState ? colorCurrentState : "grey.800"}
      borderBottom="3px solid"
      borderColor={isActiveInternal ? colorCurrentState : "transparent"}
      bg={"transparent"}
      {...{
        ...(isDisabled
          ? { cursor: "not-allowed" }
          : { _hover: { textDecoration: "none", color: "grey.800", bg: "grey.200" } }),
      }}
      {...rest}
    >
      <TextComponent
        display="block"
        {...(isDisabled && disabledReason
          ? {
              label: disabledReason,
              "aria-label": disabledReason,
            }
          : {})}
      >
        <>{children}</>
      </TextComponent>
    </Component>
  );
};

const NavBarPublic = () => {
  return (
    <>
      <NavItem to="/" exactMatch>
        Accueil
      </NavItem>
      <NavItem to="/operateurs-publics">Opérateurs publics</NavItem>
      <NavItem to="/organismes-formation">Organismes de formation</NavItem>
      <MenuQuestions />
    </>
  );
};

// pour tous les utilisateurs transverses (pour le moment)
function NavBarTransverse(): ReactElement {
  const { organisationType } = useAuth();
  return (
    <>
      <NavItem to="/" exactMatch>
        Mon tableau de bord
      </NavItem>
      <NavItem to="/organismes">{getMesOrganismesLabelFromOrganisationType(organisationType)}</NavItem>
      <NavItem to="/indicateurs">Mes indicateurs</NavItem>
      <MenuQuestions />
    </>
  );
}

function NavBarOrganismeFormation(): ReactElement {
  const { organisme } = useOrganisationOrganisme();
  return (
    <>
      <NavItem to="/" exactMatch>
        Mon tableau de bord
      </NavItem>
      {/* on s'assure qu'un organisme est responsable d'au moins un organisme formateur */}
      {organisme?.organismesFormateurs && organisme.organismesFormateurs.length > 0 && (
        <NavItem to="/organismes">Mes organismes</NavItem>
      )}
      <NavItem to="/indicateurs">Mes indicateurs</NavItem>
      <NavItem to="/effectifs">Mes effectifs</NavItem>
      {organisme && (
        <NavItem
          to="/enquete-sifa"
          isDisabled={!organisme.first_transmission_date}
          disabledReason={
            !organisme.first_transmission_date ? "Désactivé car votre organisme n'a encore rien transmis" : ""
          }
        >
          Mon enquête SIFA
        </NavItem>
      )}
      <MenuQuestions />

      <NavItem to="/parametres" ml="auto">
        <SettingsIcon mr={2} />
        Paramètres
      </NavItem>
    </>
  );
}

function NavBarAutreOrganisme({ organismeId }: { organismeId: string }): ReactElement {
  const { organisme } = useEffectifsOrganisme(organismeId);

  return (
    <Container maxW="xl">
      <Flex as="nav" align="center" wrap="wrap" w="100%" fontSize="zeta">
        <Box p={4} bg={"transparent"}>
          <ParentGroupIcon mt="-0.3rem" boxSize={4} color="dsfr_lightprimary.bluefrance_850" />
        </Box>
        <NavItem to={`/organismes/${organismeId}`} exactMatch colorActive="dsfr_lightprimary.bluefrance_850">
          Son tableau de bord
        </NavItem>

        {organisme?.organismesFormateurs && organisme.organismesFormateurs.length > 0 && (
          <NavItem to={`/organismes/${organismeId}/organismes`} colorActive="dsfr_lightprimary.bluefrance_850">
            Ses organismes
          </NavItem>
        )}
        {organisme?.permissions?.indicateursEffectifs && (
          <>
            {/* on s'assure qu'un organisme est responsable d'au moins un organisme formateur */}
            <NavItem to={`/organismes/${organismeId}/indicateurs`} colorActive="dsfr_lightprimary.bluefrance_850">
              Ses indicateurs
            </NavItem>
          </>
        )}
        {organisme?.permissions?.manageEffectifs && (
          <>
            <NavItem to={`/organismes/${organismeId}/effectifs`} colorActive="dsfr_lightprimary.bluefrance_850">
              Ses effectifs
            </NavItem>
            <NavItem
              to={`/organismes/${organismeId}/enquete-sifa`}
              isDisabled={!organisme.first_transmission_date}
              disabledReason={
                !organisme.first_transmission_date ? "Désactivé car l'organisme n'a encore rien transmis" : ""
              }
            >
              Son enquête SIFA
            </NavItem>
          </>
        )}
      </Flex>
    </Container>
  );
}

function getNavBarComponent(auth?: AuthContext): ReactElement {
  switch (auth?.organisation?.type) {
    case "ORGANISME_FORMATION": {
      return <NavBarOrganismeFormation />;
    }

    case "TETE_DE_RESEAU":
    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DRAFPIC":
    case "DDETS":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      // fourre-tout, mais on pourra avoir des différences plus tard
      return <NavBarTransverse />;
  }
  return <NavBarPublic />;
}

const MenuQuestions = () => {
  const { trackPlausibleEvent } = usePlausibleTracking();
  return (
    <>
      <Menu>
        <MenuButton
          p={4}
          color="grey.800"
          borderBottom="3px solid"
          borderColor="transparent"
          bg="transparent"
          _hover={{ textDecoration: "none", color: "grey.800", bg: "grey.200" }}
          onClick={() => trackPlausibleEvent("clic_homepage_questions")}
        >
          <Text display="block">
            Question ? <ChevronDownIcon />
          </Text>
        </MenuButton>
        <MenuList>
          <MenuItem
            as="a"
            href="https://mission-apprentissage.notion.site/Page-d-Aide-FAQ-dbb1eddc954441eaa0ba7f5c6404bdc0"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackPlausibleEvent("clic_homepage_page_aide")}
          >
            Page d’aide
          </MenuItem>
          <MenuItem as="a" href="/glossaire">
            Glossaire
          </MenuItem>
          <MenuItem
            as="a"
            href={`mailto:${CONTACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackPlausibleEvent("clic_homepage_envoi_message")}
          >
            Nous envoyer un message
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
};

const NavigationMenu = () => {
  const router = useRouter();
  const { auth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const showSubNavBar = auth && router.pathname.startsWith("/organismes/[organismeId]");
  const subOrganismeId = router.query.organismeId as string;

  return (
    <Box w="full" boxShadow="md">
      <Box borderBottom={"1px solid"} borderColor={"grey.400"}>
        <Container maxW="xl">
          <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%">
            <Box display={{ base: "block", md: "none" }} onClick={() => setIsOpen(!isOpen)} py={4}>
              {isOpen ? <Close boxSize={8} /> : <MenuFill boxSize={8} />}
            </Box>

            <Box
              display={{ base: isOpen ? "block" : "none", md: "block" }}
              flexBasis={{ base: "100%", md: "auto" }}
              w="full"
              px={1}
            >
              <Flex
                align="center"
                justify={["center", "space-between", "flex-start", "flex-start"]}
                direction={["column", "row", "row", "row"]}
                pb={[8, 0]}
                textStyle="sm"
              >
                {getNavBarComponent(auth)}
              </Flex>
            </Box>
          </Flex>
        </Container>
      </Box>
      {showSubNavBar && <NavBarAutreOrganisme organismeId={subOrganismeId} />}
    </Box>
  );
};

export default NavigationMenu;
