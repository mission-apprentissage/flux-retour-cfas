import React from "react";
import NavLink from "next/link";
import { Text } from "@chakra-ui/react";
import { useRouter } from "next/router";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Table from "@/components/Table/Table";
import { ArrowRightLine } from "@/theme/components/icons";
import { getUserOrganisationLabel, USER_STATUS_LABELS } from "@/common/constants/usersConstants";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const UsersList = ({ data, pagination, sorting, searchValue, rolesById }) => {
  const router = useRouter();

  return (
    <Table
      mt={4}
      data={data || []}
      manualPagination={true}
      pagination={pagination}
      sorting={sorting}
      onPaginationChange={({ page, limit }) => {
        router.push({ pathname: "/admin/users", query: { page, limit } }, null, { shallow: true });
      }}
      columns={{
        nom: {
          size: 200,
          header: () => "Nom",
        },
        prenom: {
          size: 100,
          header: () => "Prénom",
        },
        main_organisme: {
          size: 100,
          header: () => "Etablissement",
          cell: ({ getValue }) => (
            <NavLink href={`/admin/organismes/${getValue()?._id}`} flexGrow={1}>
              <Text isTruncated maxWidth={400}>
                {getValue()?.nom}
              </Text>
            </NavLink>
          ),
        },
        organisation: {
          size: 70,
          header: () => "Utilisateur",
          cell: ({ row }) => <Text fontSize="md">{getUserOrganisationLabel(row.original)}</Text>,
        },
        account_status: {
          size: 70,
          header: () => "Statut du compte",
          cell: ({ getValue }) => (
            <Text fontSize="md" whiteSpace="nowrap">
              {USER_STATUS_LABELS[getValue()] ?? getValue()}
            </Text>
          ),
        },
        roles: {
          size: 60,
          header: () => "Role",
          cell: ({ getValue, row }) => (
            <Text fontSize="md" whiteSpace="nowrap">
              {getValue()?.length > 0
                ? getValue().map((roleId) => rolesById?.[roleId]?.title || roleId)
                : row.original.is_admin
                ? "Admin"
                : ""}
            </Text>
          ),
        },
        actions: {
          size: 25,
          header: () => "",
          cell: (info) => (
            <NavLink href={`/admin/users/${info.row.original._id}`} flexGrow={1}>
              <ArrowRightLine w="1w" />
            </NavLink>
          ),
        },
      }}
      searchValue={searchValue}
    />
  );
};

export default UsersList;
