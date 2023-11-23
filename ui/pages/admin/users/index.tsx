import { SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Divider,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { AccessorKeyColumnDef, SortingState } from "@tanstack/react-table";
import Head from "next/head";
import NavLink from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import { USER_STATUS_LABELS, USER_STATUS_STYLE } from "@/common/constants/usersConstants";
import { usersExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import DownloadButton from "@/components/buttons/DownloadButton";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";
import { useUsers, useUsersFiltered, useUsersSearched } from "@/hooks/users";
import UserForm from "@/modules/admin/UserForm";
import { UserNormalized } from "@/modules/admin/users/models/users";
import UsersFiltersPanel from "@/modules/admin/users/UsersFiltersPanel";
import NewTable from "@/modules/indicateurs/NewTable";
import { ArrowRightLine } from "@/theme/components/icons";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

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
        <Text color={USER_STATUS_STYLE[row.original?.account_status] ?? "black"} fontSize="sm">
          {USER_STATUS_LABELS[row.original?.account_status] ?? row.original?.account_status}
        </Text>
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

  const { isLoading, allUsers, refetchUsers } = useUsers();
  const { filteredUsers } = useUsersFiltered(allUsers);
  const { searchedUsers } = useUsersSearched(filteredUsers, search);

  const defaultSort: SortingState = [{ desc: true, id: "created_at" }];
  const [sort, setSort] = useState<SortingState>(defaultSort);

  const closeModal = () => router.push("/admin/users", undefined, { shallow: true });

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

      <Heading as="h1" mb={8} mt={6}>
        {title}
      </Heading>

      <Box border="1px solid" borderColor="openbluefrance" p={4}>
        <HStack mb="4" spacing="8">
          <InputGroup>
            <Input
              placeholder="Rechercher un utilisateur par nom, prénom, email, siret, établissement, etc."
              type="search"
              name="q"
              defaultValue={search}
              onChange={(e) => setSearch(e.target.value)}
              flex="1"
              mr="2"
            />
            <InputRightElement>
              <Button backgroundColor="bluefrance" _hover={{ textDecoration: "none" }}>
                <SearchIcon textColor="white" />
              </Button>
            </InputRightElement>
          </InputGroup>
          <DownloadButton
            mr="4"
            w="25%"
            variant="secondary"
            action={async () => {
              exportDataAsXlsx(
                `users.xlsx`,
                searchedUsers?.map((e) => {
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
        </HStack>
        <Divider mb="4" />
        <HStack>
          <UsersFiltersPanel />
        </HStack>
      </Box>

      <Text py="6" color="#777">
        {Intl.NumberFormat().format(searchedUsers.length || 0)}{" "}
        {searchedUsers.length > 1 ? "comptes utilisateurs" : "compte utilisateur"}
        {searchedUsers.length < allUsers.length ? ` (${allUsers.length} au total)` : ""}
      </Text>

      <NewTable
        data={searchedUsers || []}
        loading={isLoading}
        sortingState={sort}
        onSortingChange={(state) => setSort(state)}
        columns={UsersColumns}
      />
    </Page>
  );
};

export default withAuth(Users, ["ADMINISTRATEUR"]);
