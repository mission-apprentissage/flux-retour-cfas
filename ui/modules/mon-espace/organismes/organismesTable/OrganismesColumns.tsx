import { CheckCircleIcon } from "@chakra-ui/icons";
import { Badge, Box, Button, Flex, Icon, List, ListItem, Text, UnorderedList } from "@chakra-ui/react";

import { _post } from "@/common/httpClient";
import Link from "@/components/Links/Link";
import { BasicModal } from "@/components/Modals/BasicModal";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import { AbandonsIcon, InscritsSansContratsIcon, RupturantsIcon } from "@/modules/dashboard/icons";
import { ArrowDropRightLine } from "@/theme/components/icons";

const organismesTableColumnsDefs = [
  {
    header: () => "Nom de l’organisme",
    accessorKey: "normalizedName",
    cell: ({ row }) => (
      <>
        <Link
          href={`/organismes/${(row.original as any)?._id}`}
          display="block"
          fontSize="1rem"
          width="var(--chakra-sizes-lg)"
          title={row.original.raison_sociale ?? row.original.enseigne ?? row.original.nom}
        >
          {row.original.nom ?? "Organisme inconnu"}
        </Link>
        <Text fontSize="xs" pt={2} color="#777777" whiteSpace="nowrap">
          SIRET&nbsp;: {(row.original as any).siret}
        </Text>
      </>
    ),
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
          contentComponent={() => (
            <Box>
              <Text as="p">
                Nom de la commune, code postal et code commune INSEE de l’établissement qui accueille physiquement les
                apprentis et les forme.
              </Text>
            </Box>
          )}
          aria-label="Nom de la commune, code postal et code commune INSEE de l’établissement qui accueille
        physiquement les apprentis et les forme."
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
  },
  {
    accessorKey: "formationsCount",
    header: () => (
      <>
        Formations
        <InfoTooltip
          contentComponent={() => (
            <Box>
              <b>Formations de l’établissement</b>
              <Text>
                Le nombre de formations associées à cet organisme provient du{" "}
                <Link
                  href="https://catalogue-apprentissage.intercariforef.org/"
                  isExternal
                  textDecoration="underline"
                  display="inline"
                >
                  Catalogue des offres de formations en apprentissage
                </Link>{" "}
                (Carif-Oref) dont votre établissement à la gestion. Si une erreur est constatée, écrivez à{" "}
                <Link
                  href="mailto:pole-apprentissage@intercariforef.org"
                  isExternal
                  textDecoration="underline"
                  display="inline"
                >
                  pole-apprentissage@intercariforef.org
                </Link>{" "}
                avec les informations suivantes :
              </Text>
              <UnorderedList mt={4} mb={4}>
                <ListItem>votre SIRET ;</ListItem>
                <ListItem>RNCP et/ou le code diplôme ;</ListItem>
                <ListItem>
                  la période d&apos;inscription telle que mentionnée dans le catalogue Carif-Oref (exprimée en AAAA-MM)
                  ;
                </ListItem>
                <ListItem>le lieu de la formation (code commune INSEE ou à défaut code postal) ;</ListItem>
                <ListItem>mail de la personne signalant l’erreur ;</ListItem>
              </UnorderedList>
              <Text>
                Une investigation sera menée par le Réseau des Carif-Oref pour le traitement de cette anomalie.
              </Text>
            </Box>
          )}
          aria-label="Indication de l’état administratif du SIRET de l’établissement, tel qu’il est renseigné
    sur l’INSEE."
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
      </Flex>
    ),
    size: 600,
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
      </Flex>
    ),
    size: 600,
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
      </Flex>
    ),
    size: 600,
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

          {row.original.users.length > 0 && (
            <Text>Les contacts ci-dessous ont créé un compte sur le Tableau de bord de l’apprentissage :</Text>
          )}
          <List spacing={3}>
            {row.original.users.map((user, index) => (
              <ListItem key={index}>
                <Flex align="center" gap={2}>
                  <Text fontWeight="bold">
                    {user.prenom} {user.nom}
                  </Text>
                  {user.lastLogin && (
                    <Badge colorScheme="blue" borderRadius="full" px={3} py={1} fontSize="sm">
                      <Icon as={CheckCircleIcon} mr={1} /> Dernière connexion : {user.lastLogin}
                    </Badge>
                  )}
                </Flex>
                {user.fonction && <Text>{user.fonction}</Text>}
                {user.email && <Text>{user.email}</Text>}
                {user.telephone && <Text>{user.telephone}</Text>}
              </ListItem>
            ))}
          </List>
        </Flex>
      </BasicModal>
    ),
  },
];

export default organismesTableColumnsDefs;
