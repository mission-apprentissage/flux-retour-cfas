import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Text } from "@chakra-ui/react";

import { FIABILISATION_LABEL } from "@/common/constants/fiabilisation.js";
import Table from "@/components/Table/Table";
import { ArrowRightLine } from "@/theme/components/icons";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";

const OrganismesList = ({ data, pagination, sorting, searchValue, highlight }) => {
  const router = useRouter();

  return (
    <Table
      mt={4}
      data={data || []}
      manualPagination={true}
      pagination={pagination}
      sorting={sorting}
      onPaginationChange={({ page, limit }) => {
        router.push({ pathname: "/admin/organismes", query: { ...router.query, page, limit } }, null, {
          shallow: true,
        });
      }}
      pageSizes={[10, 50, 100, 200]}
      enableSorting={true}
      manualSorting={true}
      onSortingChange={({ field, direction }) => {
        router.push(
          { pathname: "/admin/organismes", query: { ...router.query, page: 1, sort: `${field}:${direction}` } },
          null,
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
              as={getValue() ? Link : "p"}
              fontSize="1rem"
              href={{ query: { ...router.query, nature: getValue() } }}
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
              as={getValue() ? Link : "p"}
              fontSize="0.9rem"
              variant={getValue() === highlight?.siret ? "highlight" : undefined}
              href={{ query: { ...router.query, siret: getValue() } }}
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
              as={getValue() ? Link : "p"}
              href={{ query: { ...router.query, uai: getValue() } }}
              fontSize="0.9rem"
              variant={getValue() && getValue() === highlight?.uai ? "highlight" : undefined}
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
              as={getValue() ? Link : "p"}
              href={{ query: { ...router.query, est_dans_le_referentiel: getValue() } }}
              fontSize="0.9rem"
            >
              {getValue() ? "OUI" : "NON"}
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
            <Link href={`/admin/organismes/${row.original._id}`} flexGrow={1}>
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
