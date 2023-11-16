import {
  Box,
  Heading,
  HStack,
  Input,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { AccessorKeyColumnDef, SortingState } from "@tanstack/react-table";
import Head from "next/head";
import NavLink from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

import { USER_STATUS_LABELS } from "@/common/constants/usersConstants";
import { usersExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import DownloadButton from "@/components/buttons/DownloadButton";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import UserForm from "@/modules/admin/UserForm";
import NewTable from "@/modules/indicateurs/NewTable";
import { ArrowRightLine } from "@/theme/components/icons";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const NO_LIMIT = 10_000;

type UserNormalized = {
  _id: string;
  normalizedNomPrenom: string;
  normalizedEmail: string;
  normalizedOrganismeNom: string;
  organisationType: string;
  organismeId: string;
  organismeNom: string;
  nom: string;
  prenom: string;
  account_status: string;
  created_at: string;
  email: string;
  fonction: string;
  last_connection: string;
};

const UsersColumns: AccessorKeyColumnDef<UserNormalized>[] = [
  {
    header: () => "Nom et prénom",
    accessorKey: "normalizedNomPrenom",
    cell: ({ row }) => (
      <>
        <Text fontSize="md">
          {row.original?.nom} {row.original?.prenom}
        </Text>
        <Text fontSize="xs" color="#777">
          {row.original?.email}
          {row.original?.fonction ? ` - ${row.original?.fonction}` : ""}
        </Text>
      </>
    ),
  },
  {
    header: () => "Etablissement",
    accessorKey: "normalizedOrganismeNom",
    cell: ({ row }) => {
      return (
        <Box
          {...(row.original?.organismeId ? { as: NavLink, href: `/organismes/${row.original?.organismeId}` } : {})}
          flexGrow={1}
        >
          <Text isTruncated maxWidth={400}>
            {row.original?.organismeNom}
          </Text>
          {row.original?.organismeNom !== row.original?.organisationType && row.original?.organisationType ? (
            <Text fontSize="xs" color="#777">
              {row.original?.organisationType}
            </Text>
          ) : null}
        </Box>
      );
    },
  },
  {
    header: () => "Date de création",
    accessorKey: "created_at",
    cell: ({ row }) => (
      <>
        <Text fontSize="sm">Créé le {formatDateNumericDayMonthYear(row.original?.created_at)}</Text>
        <Text fontSize="xs" color="#777">
          {row.original?.last_connection ? (
            <>Dernière connexion le {formatDateNumericDayMonthYear(row.original?.last_connection)}</>
          ) : (
            <>Jamais connecté</>
          )}
        </Text>
      </>
    ),
  },
  {
    header: () => "Statut du compte",
    accessorKey: "account_status",
    cell: ({ row }) => (
      <>
        <Text fontSize="sm">{USER_STATUS_LABELS[row.original?.account_status] ?? row.original?.account_status}</Text>
      </>
    ),
  },
  {
    header: () => "",
    accessorKey: "_id",
    cell: ({ row }) => (
      <NavLink href={`/admin/users/${row.original?._id}`}>
        <ArrowRightLine w="1w" />
      </NavLink>
    ),
  },
];

const Users = () => {
  const title = "Gestion des utilisateurs";
  const router = useRouter();
  const [search, setSearch] = useState<string>("");

  const {
    data,
    refetch: refetchUsers,
    isLoading,
  } = useQuery(["admin/users"], () =>
    _get<{ data: any[] }>("/api/v1/admin/users/", {
      params: {
        page: 1,
        limit: NO_LIMIT,
      },
    })
  );

  const users = useMemo(() => {
    if (!data) return [];
    return data.data.map((user) => {
      const organismeId = user?.organisation?.organisme?._id;
      const organismeNom = user?.organisation?.organisme?.nom || user?.organisation?.label || "";
      return {
        ...user,
        organismeId,
        organismeNom,
        organisationType: user?.organisation?.label || "",
        normalizedOrganismeNom: organismeNom.toLowerCase(),
        normalizedNomPrenom: user.nom.toLowerCase() + " " + user.prenom.toLowerCase(),
        normalizedEmail: user.email.toLowerCase(),
      };
    });
  }, [data]);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    return users?.filter((user) => {
      const searchLower = search.toLowerCase();
      return (
        user.normalizedNomPrenom.includes(searchLower) ||
        user.normalizedEmail.includes(searchLower) ||
        user.normalizedOrganismeNom.toLowerCase().includes(searchLower)
      );
    });
  }, [search, users]);

  const defaultSort: SortingState = [{ desc: true, id: "created_at" }];
  const [sort, setSort] = useState<SortingState>(defaultSort);

  const closeModal = () => router.push("/admin/users", undefined, { shallow: true });

  console.log(filteredUsers);

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>

      <Modal isOpen={!!router.query.new} onClose={closeModal} size="2xl">
        <ModalOverlay />
        <ModalContent borderRadius="0" p={"2w"}>
          <ModalHeader paddingX="8w" fontWeight="700" color="grey.800" fontSize="alpha" textAlign="left">
            <Box as="span" verticalAlign="middle">
              Ajouter un nouvel utilisateur
            </Box>
          </ModalHeader>
          <ModalCloseButton width="80px">
            fermer
            <Box paddingLeft="1w" as="i" className="ri-close-line" />
          </ModalCloseButton>
          <UserForm
            user={null}
            onCreate={async (_action, error) => {
              if (!error) {
                closeModal();
                await refetchUsers();
              }
            }}
          />
        </ModalContent>
      </Modal>

      <VStack alignItems="baseline" width="100%">
        <HStack justifyContent="space-between" alignItems="baseline" width="100%">
          <Heading as="h1" mb={8} mt={6}>
            {title}
          </Heading>
          {/** désactivé tant que formulaire de création pas complet */}
          {/* {!isLoading && (
            <Button as={NavLink} href="?new=1" bg="bluefrance" color="white" _hover={{ bg: "blue.700" }}>
              Créer un utilisateur
            </Button>
          )} */}
        </HStack>
        <Stack spacing={2} width="100%">
          <HStack gap={0}>
            <Input
              placeholder="Rechercher un utilisateur par nom, prénom, email, siret, établissement, etc."
              type="search"
              name="q"
              defaultValue={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </HStack>
          <HStack>
            <DownloadButton
              mr="4"
              variant="secondary"
              action={async () => {
                exportDataAsXlsx(
                  `users.xlsx`,
                  filteredUsers.map((e) => {
                    return {
                      account_status: e.account_status,
                      civility: e.civility,
                      created_at: e.created_at,
                      nom: e.nom,
                      prenom: e.prenom,
                      email: e.email,
                      telephone: e.telephone,
                      fonction: e.fonction,
                      "organisation.type": e.organisation.type,
                      "organisation.siret": e.organisation.siret,
                      "organisation.uai": e.organisation.uai,
                      "organisation.label": e.organisation.label,
                      "organisation.organisme.nature": e.organisation.organisme?.nature,
                      "organisation.organisme.nom": e.organisation.organisme?.nom,
                      "organisation.organisme.raison_sociale": e.organisation.organisme?.raison_sociale,
                      "organisation.organisme.reseaux": e.organisation.organisme?.reseaux?.join(", "),
                      password_updated_at: e.password_updated_at,
                      has_accept_cgu_version: e.has_accept_cgu_version,
                      last_connection: e.last_connection,
                      _id: e._id,
                    };
                  }),
                  usersExportColumns
                );
              }}
            >
              Télécharger la liste
            </DownloadButton>
            <Text py="6" color="#777">
              {Intl.NumberFormat().format(filteredUsers.length || 0)}{" "}
              {filteredUsers.length > 1 ? "comptes utilisateurs" : "compte utilisateur"}
              {filteredUsers.length < users.length ? ` (${users.length} au total)` : ""}
            </Text>
          </HStack>
          <NewTable
            data={filteredUsers || []}
            loading={isLoading}
            sortingState={sort}
            onSortingChange={(state) => setSort(state)}
            columns={UsersColumns}
          />
        </Stack>
      </VStack>
    </Page>
  );
};

export default withAuth(Users, ["ADMINISTRATEUR"]);
