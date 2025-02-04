import { CheckCircleIcon } from "@chakra-ui/icons";
import { Badge, Box, Button, Flex, Icon, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import { format } from "date-fns";

import { _post } from "@/common/httpClient";
import Link from "@/components/Links/Link";
import { BasicModal } from "@/components/Modals/BasicModal";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import { AbandonsIcon, InscritsSansContratsIcon, RupturantsIcon } from "@/modules/dashboard/icons";
import { ArrowDropRightLine } from "@/theme/components/icons";

const organismesTableColumnsDefs = [
  {
    header: () => "Nom de l’organisme",
    accessorKey: "nom",
    cell: ({ row }) => (
      <>
        <Text fontSize="1rem">{row.original.nom ?? "Organisme inconnu"}</Text>
        <Text fontSize="xs" pt={2} color="#777777" whiteSpace="nowrap">
          SIRET&nbsp;: {(row.original as any).siret}
        </Text>
      </>
    ),
    size: 400,
  },
  {
    accessorKey: "adresse",
    sortingFn: (a, b) => {
      const communeA = a.original.adresse?.commune || "";
      const communeB = b.original.adresse?.commune || "";
      return communeA.localeCompare(communeB);
    },
    header: () => (
      <>
        Localisation
        <InfoTooltip
          headerComponent={() => "Localisation"}
          contentComponent={() => (
            <Box>
              <Text as="p">
                Nom de la commune, code postal et code commune INSEE de l’établissement qui accueille physiquement les
                apprentis et les forme.
              </Text>
            </Box>
          )}
          aria-label="Localisation"
        />
      </>
    ),
    cell: ({ row }) => (
      <Box>
        {row.original.adresse?.commune || ""}
        <Text fontSize="xs" pt={2} color="#777777" whiteSpace="nowrap">
          {row.original.adresse?.code_postal || ""}
          {row.original.adresse?.code_insee && row.original.adresse?.code_postal !== row.original.adresse?.code_insee
            ? ` (Insee: ${row.original.adresse?.code_insee})`
            : ""}
        </Text>
      </Box>
    ),
    size: 200,
  },
  {
    accessorKey: "formations_count",
    header: () => (
      <>
        Formations
        <InfoTooltip
          headerComponent={() => "Formations en apprentissage"}
          contentComponent={() => (
            <Box>
              <Text>Il s’agit du nombre de formations en apprentissage associées à cet organisme.</Text>
              <Text>
                Source :{" "}
                <Link
                  href="https://catalogue-apprentissage.intercariforef.org/"
                  isExternal
                  textDecoration="underline"
                  display="inline"
                >
                  Catalogue des offres de formations en apprentissage
                </Link>{" "}
                (Carif-Oref)
              </Text>
            </Box>
          )}
          aria-label="Formations en apprentissage"
        />
      </>
    ),
    cell: ({ getValue, row: { original } }) => (
      <Text>
        <Link
          href={`https://catalogue-apprentissage.intercariforef.org/etablissement/${original?.siret || ""}`}
          isExternal
          isUnderlined
          color="bluefrance"
        >
          {getValue()}
        </Link>
      </Text>
    ),
    size: 150,
  },
  {
    accessorKey: "inscrits",
    sortingFn: (a, b) => {
      const communeA = a.original.adresse?.commune || "";
      const communeB = b.original.adresse?.commune || "";
      return communeA.localeCompare(communeB);
    },
    header: () => (
      <Flex gap={2}>
        <InscritsSansContratsIcon w={4} h={4} /> JSC
        <InfoTooltip
          headerComponent={() => "Jeunes inscrits sans contrat d’apprentissage"}
          contentComponent={() => (
            <Box>
              <Text as="p">
                Un jeune sans contrat est un jeune inscrit qui débute sa formation sans contrat signé en entreprise. Le
                jeune dispose d&apos;un délai de 3 mois pour trouver son entreprise et continuer sereinement sa
                formation.
              </Text>
            </Box>
          )}
          aria-label="Jeunes inscrits sans contrat d’apprentissage"
        />
      </Flex>
    ),
    size: 150,
  },
  {
    accessorKey: "rupturants",
    sortingFn: (a, b) => {
      const communeA = a.original.adresse?.commune || "";
      const communeB = b.original.adresse?.commune || "";
      return communeA.localeCompare(communeB);
    },
    header: () => (
      <Flex gap={2}>
        <RupturantsIcon w={4} h={4} /> Ruptures
        <InfoTooltip
          headerComponent={() => "Jeunes en rupture de contrat"}
          contentComponent={() => (
            <Box>
              <Text as="p">
                Un jeune est considéré en rupture lorsqu’il ne travaille plus dans l’entreprise qui l&apos;accueillait
                car il a rompu un contrat d’apprentissage. Néanmoins, il reste inscrit dans le centre de formation et
                dispose d&apos;un délai de 6 mois pour retrouver une entreprise auprès de qui se former.
              </Text>
            </Box>
          )}
          aria-label="Jeunes en rupture de contrat"
        />
      </Flex>
    ),
    size: 150,
  },
  {
    accessorKey: "abandons",
    sortingFn: (a, b) => {
      const communeA = a.original.adresse?.commune || "";
      const communeB = b.original.adresse?.commune || "";
      return communeA.localeCompare(communeB);
    },
    header: () => (
      <Flex gap={2}>
        <AbandonsIcon w={4} h={4} /> Sorties
        <InfoTooltip
          headerComponent={() => "Sorties d’apprentissage (anciennement “abandons”)"}
          contentComponent={() => (
            <Box>
              <Text as="p">
                Il s’agit du nombre d’apprenants ou apprentis qui ont définitivement quitté le centre de formation à la
                date affichée. Cette indication est basée sur un statut transmis par les organismes de formation. Ces
                situations peuvent être consécutives à une rupture de contrat d’apprentissage avec départ du centre de
                formation, à un départ du centre de formation sans que l’apprenant n’ait jamais eu de contrat, à un
                départ du centre de formation pour intégrer une entreprise en CDI ou CDD plus rémunérateur.
              </Text>
            </Box>
          )}
          aria-label="Sorties d’apprentissage (anciennement “abandons”)"
        />
      </Flex>
    ),
    size: 150,
  },
  {
    accessorKey: "more",
    enableSorting: false,
    header: () => "Voir",
    cell: ({ row }) => (
      <BasicModal
        size="xl"
        title="Contacts du CFA"
        renderTrigger={(onOpen) => (
          <Button
            bg="#F5F5FE"
            p={2}
            rounded="lg"
            color="bluefrance"
            flexGrow={1}
            _hover={{ bg: "bluefrance", color: "white" }}
            onClick={onOpen}
          >
            <ArrowDropRightLine />
          </Button>
        )}
      >
        <Flex direction="column" gap={4}>
          <Flex direction="column" flexGrow={1} borderLeft="4px solid" borderColor="bluefrance" pl={6} ml={6}>
            <Text fontSize="lg" fontWeight="bold">
              {row.original.raison_sociale ?? row.original.enseigne ?? row.original.nom}
            </Text>
            <Text>{row.original.adresse.complete}</Text>
          </Flex>

          {row.original.users.length > 0 ? (
            <Text>Les contacts ci-dessous ont créé un compte sur le Tableau de bord de l’apprentissage :</Text>
          ) : (
            <Text>
              À ce jour, ni compte utilisateur sur le Tableau de bord de l’apprentissage ni email générique ne sont
              retrouvés pour ce CFA.
            </Text>
          )}
          <UnorderedList spacing={3}>
            {row.original.users.map((user, index) => (
              <ListItem key={index}>
                <Flex align="center" gap={2}>
                  <Text fontWeight="bold">
                    {user.prenom} {user.nom}
                  </Text>
                  {user.last_connection && (
                    <Badge variant={"purple"} borderRadius="full" px={3} py={1} fontSize="sm">
                      <Flex align="center" gap={1}>
                        <Icon as={CheckCircleIcon} mr={1} /> Dernière connexion :{" "}
                        {format(new Date(user.last_connection), "dd/MM/yyyy")}
                      </Flex>
                    </Badge>
                  )}
                </Flex>
                {user.fonction && <Text>{user.fonction}</Text>}
                {user.email && <Text>{user.email}</Text>}
                {user.telephone && <Text>{user.telephone}</Text>}
              </ListItem>
            ))}
          </UnorderedList>
        </Flex>
      </BasicModal>
    ),
    size: 70,
  },
];

export default organismesTableColumnsDefs;
