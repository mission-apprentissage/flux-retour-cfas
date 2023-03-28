import React, { ReactElement, useState } from "react";
import { useRouter } from "next/router";
import { Box, Container, Flex, Text, Tooltip } from "@chakra-ui/react";

import useAuth from "../../../hooks/useAuth";
import { MenuFill, Close, ParentGroupIcon } from "../../../theme/components/icons";
import Link from "../../Links/Link";
import { OrganisationType } from "@/common/internal/Organisation";
import { useOrganisationOrganisme } from "@/hooks/organismes";
import { AuthContext } from "@/common/internal/AuthContext";

function getMesOrganismesLabelFromOrganisationType(type: OrganisationType): string {
  switch (type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR":
      return "Mes organismes";

    case "TETE_DE_RESEAU":
      return "Mon réseau";

    case "DREETS":
    case "DEETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
      return "Mon territoire";

    case "OPERATEUR_PUBLIC_NATIONAL":
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
  ...rest
}) => {
  const router = useRouter();
  const isActiveInternal = isActive || router.pathname === to || router.asPath === to;

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
      <NavItem to="/">Accueil</NavItem>
      <NavItem to="/explorer-les-indicateurs">Indicateurs en temps réel</NavItem>
    </>
  );
};

// pour tous les utilisateurs transverses (pour le moment)
function NavBarTransverse(): ReactElement {
  const { organisationType } = useAuth();
  return (
    <>
      <NavItem to="/mon-espace/mon-organisme">Mon tableau de bord</NavItem>
      <NavItem to="/mon-espace/mes-organismes">{getMesOrganismesLabelFromOrganisationType(organisationType)}</NavItem>
    </>
  );
}

function NavBarOrganismeFormation(): ReactElement {
  const { organisme } = useOrganisationOrganisme();
  return (
    <>
      <NavItem to="/mon-espace/mon-organisme">Mon tableau de bord</NavItem>
      <NavItem to="/mon-espace/mes-organismes">Mes organismes</NavItem>
      <NavItem to="/mon-espace/mon-organisme/effectifs">Mes effectifs</NavItem>
      {organisme && (
        <NavItem
          to="/mon-espace/mon-organisme/enquete-SIFA"
          isDisabled={!organisme.first_transmission_date}
          disabledReason={
            !organisme.first_transmission_date ? "Désactivé car votre organisme n'a encore rien transmis" : ""
          }
        >
          Mon enquête SIFA
        </NavItem>
      )}
    </>
  );
}

function NavBarAutreOrganisme(): ReactElement {
  // FIXME récupérer le contexte de l'organisme visité recoil atom ?
  // const { organisme } = useOrganisme();
  return (
    <>
      <Box p={4} bg={"transparent"}>
        <ParentGroupIcon mt="-0.3rem" boxSize={4} color="dsfr_lightprimary.bluefrance_850" />
      </Box>
      {/* <NavItem to={`/mon-espace/organisme/${organisme_id}`} colorActive="dsfr_lightprimary.bluefrance_850">
        Son tableau de bord
      </NavItem> */}
      <NavItem to={"/mon-espace/organisme/635acda75e798f12bd919367"} colorActive="dsfr_lightprimary.bluefrance_850">
        Son tableau de bord
      </NavItem>
    </>
  );
}

function getNavBarComponent(auth?: AuthContext): ReactElement {
  switch (auth?.organisation?.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      return <NavBarOrganismeFormation />;
    }

    case "TETE_DE_RESEAU":
    case "DREETS":
    case "DEETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      // fourre-tout, mais on pourra avoir des différences plus tard
      return <NavBarTransverse />;
  }
  return <NavBarPublic />;
}

const NavigationMenu = ({ ...props }) => {
  const { auth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box w="full" {...props} boxShadow="md">
      <Box borderBottom={"1px solid"} borderColor={"grey.400"}>
        <Container maxW="xl">
          <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" {...props}>
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
                justify={["center", "space-between", "flex-end", "flex-start"]}
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
      {auth && (
        <Container maxW="xl">
          <Flex as="nav" align="center" wrap="wrap" w="100%" {...props}>
            <NavBarAutreOrganisme />
          </Flex>
        </Container>
      )}
    </Box>
  );
};

export default NavigationMenu;
