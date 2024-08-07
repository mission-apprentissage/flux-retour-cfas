import {
  Container,
  HStack,
  Heading,
  ListItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { AUTRE_MODIF_RESEAU_ELEMENT_LINK, IOrganisationType } from "shared";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import { useOrganismesNormalizedLists } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import { ExternalLinkLine } from "@/theme/components/icons";

import OrganismesACompleterPanelContent from "./tabs/OrganismesACompleterPanelContent";
import OrganismesFiablesPanelContent from "./tabs/OrganismesFiablesPanelContent";
import OrganismesNonRetenusPanelContent from "./tabs/OrganismesNonRetenusPanelContent";

export type OrganismeNormalized = Organisme & {
  normalizedName: string;
  normalizedUai: string;
  normalizedCommune: string;
};

// L’ordre est celui des tabs
const tabs = [
  {
    key: "fiables",
    route: "/organismes",
    index: 0,
  },
  {
    key: "a-completer",
    route: "/organismes/a-completer",
    index: 1,
  },
  {
    key: "non-retenus",
    route: "/organismes/non-retenus",
    index: 2,
  },
] as const;

interface ListeOrganismesPageProps {
  organismes: Organisme[];
  modePublique: boolean;
  activeTab: (typeof tabs)[number]["key"];
}

function ListeOrganismesPage(props: ListeOrganismesPageProps) {
  const router = useRouter();
  const { organisationType } = useAuth();

  const title = `${props.modePublique ? "Ses" : "Mes"} organismes${props.activeTab === "a-completer" ? " non fiables" : ""}`;

  const { organismesFiables, organismesACompleter, organismesNonRetenus } = useOrganismesNormalizedLists(
    props.organismes
  );

  return (
    <SimplePage title={title}>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          {props.modePublique ? "Ses organismes" : getHeaderTitleFromOrganisationType(organisationType)}
        </Heading>

        <Text>Retrouvez ci-dessous&nbsp;:</Text>
        <UnorderedList styleType="'- '">
          <ListItem>
            les <strong>{organismesFiables.length}</strong> établissements <strong>fiables</strong>{" "}
            {props.modePublique ? "rattachés à cet organisme" : getTextContextFromOrganisationType(organisationType)} et
            la nature de chacun (inclus les prépa-apprentissage, CFA académiques, d’entreprise, etc.)
          </ListItem>
          {organismesACompleter.length !== 0 && (
            <ListItem>
              les <strong>{organismesACompleter.length}</strong> établissements <strong>non-fiabilisés</strong>
            </ListItem>
          )}
        </UnorderedList>

        <Text fontStyle="italic">
          Sources :{" "}
          <Link href="https://catalogue-apprentissage.intercariforef.org/" isExternal color="action-high-blue-france">
            Catalogue
            <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} mr={1} />
          </Link>{" "}
          et{" "}
          <Link href="https://referentiel.apprentissage.onisep.fr/" isExternal color="action-high-blue-france" ml={1}>
            Référentiel de l’apprentissage
            <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
          </Link>
        </Text>

        {["ORGANISME_FORMATION", "TETE_DE_RESEAU"].includes(organisationType) && (
          <Text mt={4}>
            Si des organismes de la liste ci-dessous sont manquants ou ne devraient pas apparaître, veuillez{" "}
            <Link variant="link" color="inherit" href={AUTRE_MODIF_RESEAU_ELEMENT_LINK} isExternal>
              nous contacter
            </Link>
            .
          </Text>
        )}

        {/* Si pas d'organismes non fiables alors on affiche pas les onglets et juste une seule liste */}
        {organismesACompleter.length === 0 && organismesNonRetenus.length === 0 ? (
          <OrganismesFiablesPanelContent organismes={organismesFiables} />
        ) : (
          <Tabs
            isLazy
            lazyBehavior="keepMounted"
            index={tabs.find((tab) => tab.key === props.activeTab)?.index}
            onChange={(index) => {
              router.push(
                {
                  pathname: `${props.modePublique ? "/organismes/[organismeId]" : ""}${tabs[index]?.route}`,
                  query: {
                    ...router.query,
                  },
                },
                undefined,
                {
                  shallow: true,
                }
              );
            }}
            mt="12"
          >
            <TabList>
              <Tab fontWeight="bold">Organismes fiables ({organismesFiables.length})</Tab>
              {organismesACompleter.length !== 0 && (
                <Tab fontWeight="bold">
                  <HStack>
                    <i className="ri-alarm-warning-fill"></i>
                    <Text>OFA : corrections attendues ({organismesACompleter.length})</Text>
                  </HStack>
                </Tab>
              )}
              {organisationType === "ADMINISTRATEUR" && organismesNonRetenus.length !== 0 && (
                <Tab fontWeight="bold">
                  <HStack>
                    <i className="ri-close-circle-fill"></i>
                    <Text>OFA : non retenus ({organismesNonRetenus.length})</Text>
                  </HStack>
                </Tab>
              )}
            </TabList>
            <TabPanels>
              <TabPanel>
                <OrganismesFiablesPanelContent organismes={organismesFiables} />
              </TabPanel>
              {organismesACompleter.length !== 0 && (
                <TabPanel>
                  <OrganismesACompleterPanelContent organismes={organismesACompleter} />
                </TabPanel>
              )}
              {organisationType === "ADMINISTRATEUR" && organismesNonRetenus.length !== 0 && (
                <TabPanel>
                  <OrganismesNonRetenusPanelContent organismes={organismesNonRetenus} />
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        )}
      </Container>
    </SimplePage>
  );
}

export default ListeOrganismesPage;

function getHeaderTitleFromOrganisationType(type: IOrganisationType) {
  switch (type) {
    case "ORGANISME_FORMATION":
      return "Mes organismes";

    case "TETE_DE_RESEAU":
      return "Les organismes de mon réseau";

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DRAFPIC":
    case "DDETS":
    case "ACADEMIE":
      return "Les organismes de mon territoire";

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return "Tous les organismes";

    default:
      throw new Error(`Type ’${type}’ inconnu`);
  }
}

function getTextContextFromOrganisationType(type: IOrganisationType) {
  switch (type) {
    case "ORGANISME_FORMATION":
      return "rattachés à votre organisme";

    case "TETE_DE_RESEAU":
      return "de votre réseau";

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DRAFPIC":
    case "DDETS":
    case "ACADEMIE":
      return "de votre territoire";

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return "de l'ensemble du territoire";

    default:
      throw new Error(`Type ’${type}’ inconnu`);
  }
}
