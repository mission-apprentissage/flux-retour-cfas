import { Text } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import Table from "@/components/Table/Table";
import { ArrowRightLine } from "@/theme/components/icons";

const EffectifsList = ({
  data,
  pagination,
  sorting,
  searchValue,
}: {
  data: any;
  pagination?: any;
  sorting?: any;
  searchValue?: any;
}) => {
  const router = useRouter();

  return (
    <Table
      mt={4}
      data={data || []}
      manualPagination={true}
      pagination={pagination}
      sorting={sorting}
      onPaginationChange={({ page, limit }) => {
        router.push({ pathname: "/admin/effectifs", query: { ...router.query, page, limit } }, undefined, {
          shallow: true,
        });
      }}
      pageSizes={[10, 50, 100, 200]}
      enableSorting={true}
      manualSorting={true}
      onSortingChange={({ field, direction }) => {
        router.push(
          { pathname: "/admin/effectifs", query: { ...router.query, page: 1, sort: `${field}:${direction}` } },
          undefined,
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
              fontSize="0.9rem"
              {...(getValue() ? { as: Link, href: { query: { ...router.query, annee_scolaire: getValue() } } } : {})}
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
              fontSize="0.9rem"
              {...(getValue() ? { as: Link, href: { query: { ...router.query, source: getValue() } } } : {})}
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
              fontSize="0.9rem"
              {...(getValue() ? { as: Link, href: { query: { ...router.query, id_erp_apprenant: getValue() } } } : {})}
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
              fontSize="0.9rem"
              {...(getValue() ? { as: Link, href: { query: { ...router.query, organisme_id: getValue()._id } } } : {})}
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
            <Link href={`/admin/effectifs/${row.original._id}`}>
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
