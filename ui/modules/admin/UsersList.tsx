import React from "react";
import NavLink from "next/link";
import { Text } from "@chakra-ui/react";
import { useRouter } from "next/router";

import Table from "@/components/Table/Table";
import { ArrowRightLine } from "@/theme/components/icons";
import { USER_STATUS_LABELS } from "@/common/constants/usersConstants";

const UsersList = ({ data, pagination, sorting, searchValue }: any) => {
  const router = useRouter();

  return (
    <Table
      mt={4}
      data={data || []}
      manualPagination={true}
      pagination={pagination}
      sorting={sorting}
      onPaginationChange={({ page, limit }) => {
        router.push({ pathname: "/admin/users", query: { ...router.query, page, limit } }, undefined, {
          shallow: true,
        });
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
        organisation: {
          size: 100,
          header: () => "Etablissement",
          cell: ({ getValue }) => {
            const organisme = getValue()?.organisme;
            return (
              <Text {...(organisme ? { as: NavLink, href: `/admin/organismes/${organisme?._id}` } : {})} flexGrow={1}>
                <Text isTruncated maxWidth={400}>
                  {organisme?.nom || getValue()?.label}
                </Text>
              </Text>
            );
          },
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
        actions: {
          size: 25,
          header: () => "",
          cell: (info) => (
            <NavLink href={`/admin/users/${info.row.original._id}`}>
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
