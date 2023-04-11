import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Text } from "@chakra-ui/react";

import Table from "@/components/Table/Table";
import { ArrowRightLine } from "@/theme/components/icons";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";

const EffectifsList = ({ data, pagination, sorting, searchValue }) => {
  const router = useRouter();

  return (
    <Table
      mt={4}
      data={data || []}
      manualPagination={true}
      pagination={pagination}
      sorting={sorting}
      onPaginationChange={({ page, limit }) => {
        router.push({ pathname: "/admin/effectifs", query: { ...router.query, page, limit } }, null, { shallow: true });
      }}
      pageSizes={[10, 50, 100, 200]}
      enableSorting={true}
      manualSorting={true}
      onSortingChange={({ field, direction }) => {
        router.push(
          { pathname: "/admin/effectifs", query: { ...router.query, page: 1, sort: `${field}:${direction}` } },
          null,
          {
            shallow: true,
          }
        );
      }}
      columns={{
        "apprenant.nom": {
          size: 200,
          header: () => "Nom",
        },
        "apprenant.prenom": {
          size: 200,
          header: () => "Prénom",
        },
        annee_scolaire: {
          size: 200,
          header: () => "Année scolaire",
          cell: ({ getValue }) => (
            <Text
              as={getValue() ? Link : "p"}
              fontSize="0.9rem"
              href={{ query: { ...router.query, annee_scolaire: getValue() } }}
            >
              {getValue() || ""}
            </Text>
          ),
        },
        source: {
          size: 200,
          header: () => "Source",
          cell: ({ getValue }) => (
            <Text
              as={getValue() ? Link : "p"}
              fontSize="0.9rem"
              href={{ query: { ...router.query, source: getValue() } }}
            >
              {getValue() || ""}
            </Text>
          ),
        },
        id_erp_apprenant: {
          size: 200,
          header: () => "ID ERP",
          cell: ({ getValue }) => (
            <Text
              as={getValue() ? Link : "p"}
              fontSize="0.9rem"
              href={{ query: { ...router.query, id_erp_apprenant: getValue() } }}
            >
              {getValue() || ""}
            </Text>
          ),
        },
        "formation.cfd": {
          size: 200,
          header: () => "CFD",
        },
        "formation.rncp": {
          size: 200,
          header: () => "RNCP",
        },
        organisme: {
          size: 100,
          header: () => "organisme",
          cell: ({ getValue }) => (
            <Text
              as={getValue() ? Link : "p"}
              fontSize="0.9rem"
              href={getValue() ? { query: { ...router.query, organisme_id: getValue()._id } } : null}
            >
              {getValue().siret}
            </Text>
          ),
        },
        created_at: {
          size: 120,
          header: () => "Date création",
          cell: ({ getValue }) => (
            <Text fontSize="1rem" color="green">
              Le {formatDateDayMonthYear(getValue())}
            </Text>
          ),
        },

        actions: {
          size: 25,
          header: () => " ",
          cell: ({ row }) => (
            <Link href={`/admin/effectifs/${row.original._id}`} flexGrow={1}>
              <ArrowRightLine />
            </Link>
          ),
        },
      }}
      searchValue={searchValue}
    />
  );
};

export default EffectifsList;
