import { ChevronDownIcon, SettingsIcon } from "@chakra-ui/icons";
import { Box, Container, Flex, Menu, MenuButton, MenuItem, MenuList, Text, Tooltip } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ReactElement, useState } from "react";
import { CRISP_FAQ, IOrganisationType, ORGANISATION_TYPE } from "shared";

import { AuthContext } from "@/common/internal/AuthContext";
import Link from "@/components/Links/Link";
import { useOrganisationOrganisme } from "@/hooks/organismes";
import { usePlausibleTracking } from "@/hooks/plausible";
import useAuth from "@/hooks/useAuth";
import { useEffectifsOrganisme } from "@/modules/mon-espace/effectifs/useEffectifsOrganisme";
import { Close, MenuFill, ParentGroupIcon } from "@/theme/components/icons";

function getMesOrganismesLabelFromOrganisationType(type: IOrganisationType): string {
  switch (type) {
    case "ORGANISME_FORMATION":
      return "Mes organismes";

    case "TETE_DE_RESEAU":
      return "Mon réseau";

    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DRAFPIC":
    case "ACADEMIE":
    case "ARML":
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
      <MenuQuestions />
    </>
  );
};

// pour tous les utilisateurs transverses (pour le moment)
function NavBarTransverse(): React.ReactElement {
  const { organisationType, organisation } = useAuth();
  const { trackPlausibleEvent } = usePlausibleTracking();

  switch (organisationType) {
    case ORGANISATION_TYPE.ACADEMIE:
      return (
        <>
          <NavItem
            exactMatch
            to="/voeux-affelnet"
            onClick={() =>
              trackPlausibleEvent("clic_homepage_voeux_affelnet", undefined, {
                organisation_type: organisation ? organisation.type : "",
                organisation_code_region: organisation && "code_region" in organisation ? organisation.code_region : "",
              })
            }
          >
            Vœux Affelnet
          </NavItem>
          <MenuQuestions />
        </>
      );
    case ORGANISATION_TYPE.DREETS:
    case ORGANISATION_TYPE.DDETS:
      return <NavItem to="/suivi-des-indicateurs">Suivi des indicateurs</NavItem>;
    default:
      return (
        <>
          {organisationType === "ADMINISTRATEUR" && (
            <NavItem to="/admin/suivi-des-indicateurs">Suivi des indicateurs</NavItem>
          )}
          {organisationType === ORGANISATION_TYPE.ARML && (
            <NavItem to="/suivi-des-indicateurs">Suivi des indicateurs</NavItem>
          )}
          <NavItem to="/home" exactMatch>
            Mon tableau de bord
          </NavItem>
          <NavItem to="/organismes">{getMesOrganismesLabelFromOrganisationType(organisationType)}</NavItem>
          <NavItem to="/indicateurs">Mes indicateurs</NavItem>
          {organisationType === ORGANISATION_TYPE.DRAFPIC && (
            <NavItem
              to="/voeux-affelnet"
              onClick={() =>
                trackPlausibleEvent("clic_homepage_voeux_affelnet", undefined, {
                  organisation_type: organisation ? organisation.type : "",
                  organisation_code_region:
                    organisation && "code_region" in organisation ? organisation.code_region : "",
                })
              }
            >
              Vœux Affelnet
            </NavItem>
          )}
          <NavItem to="/national/indicateurs">Indicateurs Nationaux</NavItem>
          <MenuQuestions />
        </>
      );
  }
}

function NavBarOrganismeFormation(): ReactElement {
  const { organisme } = useOrganisationOrganisme();
  const { auth } = useAuth();

  if (auth?.organisation?.type === "ORGANISME_FORMATION" && auth?.organisation?.ml_beta_activated_at) {
    return (
      <>
        <NavItem to="/cfa" exactMatch>
          Mon tableau de bord
        </NavItem>
        <NavItem to="/parametres">Paramètres</NavItem>
        <MenuQuestions />
      </>
    );
  }

  return (
    <>
      <NavItem to="/home" exactMatch>
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
      <NavItem to="/national/indicateurs" exactMatch>
        Indicateurs Nationaux
      </NavItem>
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
    case "ARML":
      // fourre-tout, mais on pourra avoir des différences plus tard
      return <NavBarTransverse />;
  }
  return <NavBarPublic />;
}

const MenuQuestions = () => {
  const { organisationType } = useAuth();
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
            Aide et ressources <ChevronDownIcon />
          </Text>
        </MenuButton>
        <MenuList>
          <MenuItem
            as="a"
            href={CRISP_FAQ}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackPlausibleEvent("clic_homepage_page_aide")}
          >
            Centre d’aide
          </MenuItem>
          {organisationType !== ORGANISATION_TYPE.MISSION_LOCALE && (
            <MenuItem
              as="a"
              href="/referencement-organisme"
              onClick={() => trackPlausibleEvent("clic_homepage_referencement_organisme")}
            >
              Référencement de votre organisme
            </MenuItem>
          )}
          <MenuItem as="a" href="/glossaire">
            Glossaire
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
