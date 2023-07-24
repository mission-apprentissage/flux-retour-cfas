import {
  Box,
  Center,
  Container,
  Heading,
  ListItem,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { _get } from "@/common/httpClient";
import { OrganisationType } from "@/common/internal/Organisation";
import { Organisme } from "@/common/internal/Organisme";
import { normalize } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import Ribbons from "@/components/Ribbons/Ribbons";
import { useOrganisationOrganismes } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";

import OrganismesTable from "./OrganismesTable";

type OrganismeNormalized = Organisme & {
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
    key: "non-fiables",
    route: "/organismes/non-fiables",
    index: 1,
  },
] as const;

interface ListeOrganismesPageProps {
  activeTab: (typeof tabs)[number]["key"];
}

function ListeOrganismesPage(props: ListeOrganismesPageProps) {
  const router = useRouter();
  const { organisationType } = useAuth();
  const { isLoading, organismes } = useOrganisationOrganismes();

  const title = `Mes organismes${props.activeTab === "non-fiables" ? " non fiables" : ""}`;

  const { organismesFiables, organismesNonFiables, nbOrganimesFermes } = useMemo(() => {
    const organismesFiables: OrganismeNormalized[] = [];
    const organismesNonFiables: OrganismeNormalized[] = [];
    let nbOrganimesFermes = 0;
    (organismes || []).forEach((organisme: OrganismeNormalized) => {
      // We need to memorize organismes with normalized names to be avoid running the normalization on each keystroke.
      organisme.normalizedName = normalize(organisme.nom ?? "");
      organisme.normalizedUai = normalize(organisme.uai ?? "");
      organisme.normalizedCommune = normalize(organisme.adresse?.commune ?? "");

      if (organisme.fiabilisation_statut === "FIABLE" && !organisme.ferme) {
        organismesFiables.push(organisme);
      } else {
        organismesNonFiables.push(organisme);
        if (organisme.ferme) {
          nbOrganimesFermes++;
        }
      }
    });

    return {
      organismesFiables,
      organismesNonFiables,
      nbOrganimesFermes,
    };
  }, [organismes]);

  if (isLoading && !organismes) {
    return (
      <SimplePage title={title}>
        <Container maxW="xl" p="8">
          <Center>
            <Spinner />
          </Center>
        </Container>
      </SimplePage>
    );
  }

  return (
    <SimplePage title={title}>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          {getHeaderTitleFromOrganisationType(organisationType)}
        </Heading>

        <Text>Retrouvez ci-dessous&nbsp;:</Text>
        <UnorderedList styleType="'- '">
          <ListItem>
            les <strong>{organismesFiables.length}</strong> établissements <strong>fiables</strong>{" "}
            {getTextContextFromOrganisationType(organisationType)} et la nature de chacun (inclus les
            prépa-apprentissage, CFA académiques, d’entreprise, etc.)
          </ListItem>
          {organismesNonFiables.length !== 0 && (
            <ListItem>
              les <strong>{organismesNonFiables.length}</strong> établissements <strong>non-fiabilisés</strong>
              {nbOrganimesFermes > 0 && (
                <>
                  {" "}
                  dont <strong>{nbOrganimesFermes}</strong> établissement{nbOrganimesFermes > 1 ? "s" : ""}{" "}
                  <strong>
                    fermé
                    {nbOrganimesFermes > 1 ? "s" : ""}
                  </strong>
                  .
                </>
              )}
            </ListItem>
          )}
        </UnorderedList>
        <Text fontStyle="italic">Sources : Catalogue et Référentiel de l’apprentissage</Text>

        {/* Si pas d'organismes non fiables alors on affiche pas les onglets et juste une seule liste */}
        {organismesNonFiables.length === 0 ? (
          <OrganismesFiablesPanelContent organismesFiables={organismesFiables} />
        ) : (
          <Tabs
            isLazy
            lazyBehavior="keepMounted"
            index={tabs.find((tab) => tab.key === props.activeTab)?.index}
            onChange={(index) => {
              router.push(tabs[index]?.route, undefined, { shallow: true });
            }}
            mt="12"
          >
            <TabList>
              <Tab fontWeight="bold">Organismes fiables ({organismesFiables.length})</Tab>
              <Tab fontWeight="bold">Organismes à fiabiliser ({organismesNonFiables.length})</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <OrganismesFiablesPanelContent organismesFiables={organismesFiables} />
              </TabPanel>
              <TabPanel>
                <Ribbons variant="warning" my={8}>
                  <Box color="grey.800">
                    <Text>
                      Un organisme (OFA) est considéré comme non-fiable lorsqu’il présente l’une des caractéristiques
                      suivantes&nbsp;:
                    </Text>
                    <UnorderedList styleType="'- '">
                      <ListItem>
                        Son couple UAI-SIRET n’est pas <strong>validé</strong> dans le{" "}
                        <Link
                          href="https://referentiel.apprentissage.onisep.fr/"
                          isExternal={true}
                          borderBottom="1px"
                          _hover={{ textDecoration: "none" }}
                        >
                          Référentiel de l’apprentissage
                        </Link>
                        .
                      </ListItem>
                      <ListItem>
                        Son code UAI est répertorié comme <strong>inconnu</strong> ou non <strong>validé</strong> dans
                        le{" "}
                        <Link
                          href="https://referentiel.apprentissage.onisep.fr/"
                          isExternal={true}
                          borderBottom="1px"
                          _hover={{ textDecoration: "none" }}
                        >
                          Référentiel de l’apprentissage
                        </Link>
                        .
                      </ListItem>
                      <ListItem>
                        L’état administratif du SIRET de l’établissement, tel qu’il est enregistré auprès de l’INSEE,
                        est <strong>fermé</strong>.
                      </ListItem>
                    </UnorderedList>
                    <Text>
                      Un organisme est considéré comme non-fiable dès lors qu’il remplit au moins l’une de ces
                      conditions.
                    </Text>
                    <Text fontWeight="bold">
                      Veuillez contacter les organismes non-fiables pour encourager une action auprès de leur Carif-Oref
                      ou de l’INSEE.
                    </Text>
                  </Box>
                </Ribbons>
                <OrganismesTable organismes={organismesNonFiables} modeNonFiable />
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </Container>
    </SimplePage>
  );
}

function OrganismesFiablesPanelContent({ organismesFiables }: { organismesFiables: OrganismeNormalized[] }) {
  return (
    <>
      <Ribbons variant="info" my={8}>
        <Box color="grey.800">
          <Text>Est considéré comme fiable un organisme (OFA)&nbsp;:</Text>
          <UnorderedList styleType="'- '">
            <ListItem>
              qui correspond à un couple UAI-SIRET <strong>validé</strong> dans le{" "}
              <Link
                href="https://referentiel.apprentissage.onisep.fr/"
                isExternal={true}
                borderBottom="1px"
                _hover={{ textDecoration: "none" }}
              >
                Référentiel de l’apprentissage
              </Link>
              .
            </ListItem>
            <ListItem>
              dont l’état administratif du SIRET de l’établissement, tel qu’il est renseigné sur l’INSEE, est{" "}
              <strong>ouvert</strong>.
            </ListItem>
          </UnorderedList>
        </Box>
      </Ribbons>
      <OrganismesTable organismes={organismesFiables} />
    </>
  );
}

export default ListeOrganismesPage;

function getHeaderTitleFromOrganisationType(type: OrganisationType) {
  switch (type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR":
      return "Mes organismes formateurs";

    case "TETE_DE_RESEAU":
      return "Les organismes de mon réseau";

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
      return "Les organismes de mon territoire";

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return "Tous les organismes";

    default:
      throw new Error(`Type ’${type}’ inconnu`);
  }
}

function getTextContextFromOrganisationType(type: OrganisationType) {
  switch (type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR":
      return "rattachés à votre organisme";

    case "TETE_DE_RESEAU":
      return "de votre réseau";

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
      return "de votre territoire";

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return "de l'ensemble du territoire";

    default:
      throw new Error(`Type ’${type}’ inconnu`);
  }
}
