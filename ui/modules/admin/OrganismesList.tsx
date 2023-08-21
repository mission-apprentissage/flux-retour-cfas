import { Text } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

import { FIABILISATION_LABEL } from "@/common/constants/fiabilisation";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import Table from "@/components/Table/Table";
import { ArrowRightLine } from "@/theme/components/icons";

const OrganismesList = ({ data, pagination, sorting, searchValue, highlight }: any) => {
  const router = useRouter();

  return (
    <Table
      mt={4}
      data={data || []}
      manualPagination={true}
      pagination={pagination}
      sorting={sorting}
      onPaginationChange={({ page, limit }) => {
        router.push({ pathname: "/admin/organismes", query: { ...router.query, page, limit } }, undefined, {
          shallow: true,
        });
      }}
      pageSizes={[10, 50, 100, 200]}
      enableSorting={true}
      manualSorting={true}
      onSortingChange={({ field, direction }) => {
        router.push(
          { pathname: "/admin/organismes", query: { ...router.query, page: 1, sort: `${field}:${direction}` } },
          undefined,
          {
            shallow: true,
          }
        );
      }}
      columns={{
        nom: {
          size: 200,
          header: () => "Nom de l'organisme",
          cell: ({ row }) => <Text fontSize="1rem">{row.original.enseigne || row.original.nom}</Text>,
        },
        nature: {
          size: 100,
          header: () => "Nature",
          cell: ({ getValue }) => (
            <Text
              fontSize="1rem"
              {...(getValue() ? { as: Link, href: { query: { ...router.query, nature: getValue() } } } : {})}
            >
              {getValue()}
            </Text>
          ),
        },
        adresse: {
          size: 100,
          header: () => "Localisation",
          cell: ({ getValue }) => <Text fontSize="1rem">{getValue()?.commune}</Text>,
        },
        siret: {
          size: 70,
          header: () => "SIRET",
          cell: ({ getValue }) => (
            <Text
              fontSize="0.9rem"
              variant={getValue() === highlight?.siret ? "highlight" : undefined}
              {...(getValue() ? { as: Link, href: { query: { ...router.query, siret: getValue() } } } : {})}
            >
              {getValue() || ""}
            </Text>
          ),
        },

        uai: {
          size: 60,
          header: () => "Numéro UAI",
          cell: ({ getValue }) => (
            <Text
              fontSize="0.9rem"
              variant={getValue() && getValue() === highlight?.uai ? "highlight" : undefined}
              {...(getValue() ? { as: Link, href: { query: { ...router.query, uai: getValue() } } } : {})}
            >
              {getValue() || ""}
            </Text>
          ),
        },
        est_dans_le_referentiel: {
          size: 60,
          header: () => "Dans Réfé.?",
          cell: ({ getValue }) => (
            <Text
              fontSize="0.9rem"
              {...(getValue()
                ? { as: Link, href: { query: { ...router.query, est_dans_le_referentiel: getValue() } } }
                : {})}
            >
              {getValue() || ""}
            </Text>
          ),
        },
        ferme: {
          size: 60,
          header: () => "État",
          cell: ({ getValue }) => (
            <Link href={{ query: { ...router.query, ferme: getValue() } }}>
              <Text fontSize="1rem" {...(getValue() ? { color: "redmarianne", fontWeight: "bold" } : {})}>
                {getValue() ? "Fermé" : "Actif"}
              </Text>
            </Link>
          ),
        },
        reseaux: {
          size: 60,
          header: () => "Réseaux",
          cell: ({ getValue }) => (
            <Text fontSize="1rem" whiteSpace="nowrap">
              {getValue().length
                ? getValue().map((reseau) => (
                    <Link key={reseau} href={{ query: { ...router.query, reseaux: reseau } }}>
                      {reseau}
                    </Link>
                  ))
                : ""}
            </Text>
          ),
        },
        fiabilisation_statut: {
          size: 120,
          header: () => "Fiabilisation",
          cell: ({ getValue }) => (
            <Text fontSize="1rem">
              <Link href={{ query: { ...router.query, fiabilisation_statut: getValue() } }}>
                {FIABILISATION_LABEL[getValue()] || getValue()}
              </Link>
            </Text>
          ),
        },
        effectifs_count: { header: () => "Effectifs" },
        mode_de_transmission: {
          header: () => "Mode trans.",
        },
        last_transmission_date: {
          size: 120,
          header: () => "Dernière transmission au tdb",
          cell: ({ getValue }) =>
            getValue() ? (
              <Text fontSize="1rem" color="green">
                Le {formatDateDayMonthYear(getValue())}
              </Text>
            ) : (
              <Text fontSize="1rem" color="tomato">
                Ne transmet pas
              </Text>
            ),
        },

        actions: {
          size: 25,
          header: () => " ",
          cell: ({ row }) => (
            <Link href={`/admin/organismes/${row.original._id}`}>
              <ArrowRightLine />
            </Link>
          ),
        },
      }}
      searchValue={searchValue}
    />
  );
};

export default OrganismesList;
