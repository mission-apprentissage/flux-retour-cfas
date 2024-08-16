import { Container, Heading, Stack, Text } from "@chakra-ui/react";
import { IOrganisationType } from "shared";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import { useOrganisationOrganisme, useOrganismesNormalizedLists } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import { ExternalLinkLine } from "@/theme/components/icons";

import IndicateursOrganisme from "../dashboard/IndicateursOrganisme";

import OrganismesTable from "./OrganismesTable";

export type OrganismeNormalized = Organisme & {
  normalizedName: string;
  normalizedUai: string;
  normalizedCommune: string;
};

interface ListeOrganismesPageProps {
  organismes: Organisme[];
  modePublique: boolean;
}

function ListeOrganismesPage(props: ListeOrganismesPageProps) {
  const { organisationType } = useAuth();
  const { organisme } = useOrganisationOrganisme();

  const title = `${props.modePublique ? "Ses" : "Mes"} organismes`;

  const { allOrganismes } = useOrganismesNormalizedLists(props.organismes);

  return (
    <SimplePage title={title}>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          {props.modePublique ? "Ses organismes" : getHeaderTitleFromOrganisationType(organisationType)}
        </Heading>

        <Text>
          Retrouvez ci-dessous les {allOrganismes.length} établissements sous votre gestion et la nature de chacun.
        </Text>

        <Text fontStyle="italic" mb={8}>
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
        <Text>Cliquez sur un organisme pour voir en détails les formations dont vous avez la gestion.</Text>
        <Text>Si des informations vous semblent erronées, veuillez suivre les démarches ci-dessous.</Text>

        <IndicateursOrganisme
          organismeId={organisme?._id}
          organismesCount={organisme?.organismesCount}
          loading={false} // TODO add loader
        ></IndicateursOrganisme>
        {/* Si pas d'organismes non fiables alors on affiche pas les onglets et juste une seule liste */}
        <Stack spacing="4w">
          <OrganismesTable
            organismes={allOrganismes || []}
            showFilterNature
            showFilterTransmission
            showFilterQualiopi
            showFilterPrepaApprentissage
            showFilterLocalisation
            withFormations={true}
          />
        </Stack>
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

// function getTextContextFromOrganisationType(type: IOrganisationType) {
//   switch (type) {
//     case "ORGANISME_FORMATION":
//       return "rattachés à votre organisme";

//     case "TETE_DE_RESEAU":
//       return "de votre réseau";

//     case "DREETS":
//     case "DRAAF":
//     case "CONSEIL_REGIONAL":
//     case "CARIF_OREF_REGIONAL":
//     case "DRAFPIC":
//     case "DDETS":
//     case "ACADEMIE":
//       return "de votre territoire";

//     case "OPERATEUR_PUBLIC_NATIONAL":
//     case "CARIF_OREF_NATIONAL":
//     case "ADMINISTRATEUR":
//       return "de l'ensemble du territoire";

//     default:
//       throw new Error(`Type ’${type}’ inconnu`);
//   }
// }
