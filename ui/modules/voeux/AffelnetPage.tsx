import { Box, Container, HStack, Heading, Image, Link, StackDivider, Text, VStack } from "@chakra-ui/react";
import { AccessorKeyColumnDef } from "@tanstack/react-table";

import { Organisme } from "@/common/internal/Organisme";
import SimplePage from "@/components/Page/SimplePage";
import TableWithPagination from "@/components/Table/TableWithPagination";

const affelnetColumnDefs: AccessorKeyColumnDef<any, any>[] = [
  {
    size: 200,
    header: () => "Nom du jeune",
    accessorKey: "nom",
  },
  {
    size: 200,
    header: () => "Prénom du jeune",
    accessorKey: "prénom",
  },
  {
    size: 300,
    header: () => "Formation",
    accessorKey: "formation",
  },
  {
    size: 300,
    header: () => "Email du représentant",
    accessorKey: "email",
  },
  {
    size: 300,
    header: () => "Téléphone du représentant",
    accessorKey: "email",
  },
  {
    size: 300,
    header: () => "Contacté",
    accessorKey: "contact",
  },
];

interface VoeuxAffelnetPageProps {
  organisme: Organisme;
}

function VoeuxAffelnetPage(props: VoeuxAffelnetPageProps) {
  console.log("CONSOLE LOG ~ VoeuxAffelnetPage ~ props:", props);

  return (
    <SimplePage title="Mes vœux Affelnet">
      <Container maxW="xl" p="8">
        <VStack alignItems="start" mb={8}>
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
            Mes vœux Affelnet
          </Heading>
          <HStack justifyContent="space-between" alignItems="start" p={10} bg="#F9F8F6" my={8}>
            <Box>
              <Text color="#465F9D" fontSize="gamma" fontWeight="bold" mb={3}>
                Vous n’avez pas de vœux Affelnet.
              </Text>
              <Text>
                Nous n’avons pas identifié de vœux prononcés pour votre établissement sur Affelnet, la plateforme de
                l’éducation nationale pour l’orientation des collégiens.
              </Text>

              <Link variant="whiteBg" href={`#`} mt={6}>
                En apprendre plus sur Affelnet
              </Link>
            </Box>
            <Image src="/images/voeux-affelnet.svg" alt="" userSelect="none" />
          </HStack>
          <Box my={6}>
            <TableWithPagination
              data={[]}
              columns={affelnetColumnDefs}
              pageCount={0}
              paginationState={{ pageIndex: 0, pageSize: 100 }}
              showPagination={false}
              noDataMessage="Pas de vœux identifiés pour votre établissement."
            />
          </Box>
          <Heading as="h2" color="#465F9D" fontSize="gamma" fontWeight="700" mb={6}>
            Le calendrier Affelnet 2024
          </Heading>

          <HStack justifyContent="start" alignItems="start">
            <VStack justifyContent="space-between" alignItems="start" p={5} bg="#F9F8F6" mr={10}>
              <Text fontWeight="bold">Vendredi 5 avril</Text>
              <Text fontSize="zeta">
                Ouverture de la consultation des offres de formation pour la rentrée 2024 dans le service en ligne
                affectation.
              </Text>
              <Text fontWeight="bold">Du lundi 6 mai au lundi 27 mai</Text>
              <Text fontSize="zeta">Saisie des vœux d’affectation par les familles.</Text>
              <Text fontWeight="bold">Mercredi 29 mai</Text>
              <Text fontSize="zeta">Ouverture de la consultation des vœux.</Text>
              <Text fontWeight="bold">Mercredi 26 juin</Text>
              <Text fontSize="zeta">
                Publication des résultats de l’affectation et début des inscriptions en lycée.
              </Text>
              <Text fontWeight="bold">Lundi 8 juillet (au plus tard)</Text>
              <Text fontSize="zeta">Organisation d’un deuxième tour d&apos;affectation.</Text>
            </VStack>
            <StackDivider borderColor="#6A6AF4" borderWidth={2} />
            <VStack justifyContent="start" alignItems="start" p={5}>
              <Text fontWeight="bold" mb={5}>
                Est-ce la première fois que vous entendez parler des vœux Affelnet ?
              </Text>
              <Text>
                Les OFA/CFA doivent mettre à jour leur offre de formation (ou la faire référencer) dans la base
                Carif-Oref pour un affichage sur le Catalogue de l’apprentissage et pour intégration sur Affelnet (offre
                post-3e).
              </Text>
              <Text fontWeight="bold" my={5}>
                Référencer vos formations en apprentissage sur les SI des Carif-Oref, c’est la garantie d’une large
                visibilité
              </Text>
              <Text>
                Les équipes des Carif-Oref sont à la disposition des organismes pour les accompagner dans leur démarche
                de référencement ou d’actualisation sur leurs plateformes dédiées.
              </Text>
              <Link variant="whiteBg" href={`#`} mt={6}>
                En savoir plus sur le référencement
              </Link>
            </VStack>
          </HStack>
        </VStack>
      </Container>
    </SimplePage>
  );
}

export default VoeuxAffelnetPage;
