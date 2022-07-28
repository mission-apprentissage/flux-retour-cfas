import { Button, Table, TableCaption, Tbody, Td, Th, Thead, Tr, useToast } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { useMutation, useQueryClient } from "react-query";

import { deleteReseauCfa } from "../../../common/api/tableauDeBord";
import { BasePagination } from "../../../common/components/Pagination/Pagination";
import { QUERY_KEYS } from "../../../common/constants/queryKeys";
import usePaginatedItems from "../../../common/hooks/usePaginatedItems";

const ReseauxCfasTable = ({ reseauxCfas }) => {
  const toast = useToast();

  // Pagination hook
  const [current, setCurrent, itemsSliced] = usePaginatedItems(reseauxCfas);

  // Queries
  const queryClient = useQueryClient();
  const deleteReseauxCfas = useMutation(
    (reseauCfa) => {
      return deleteReseauCfa(reseauCfa);
    },
    {
      onSuccess() {
        queryClient.invalidateQueries([QUERY_KEYS.SEARCH_RESEAUX_CFA]);
      },
    }
  );

  return (
    <Table variant="secondary">
      <TableCaption>
        <BasePagination
          current={current}
          onChange={(page) => {
            setCurrent(page);
          }}
          total={reseauxCfas?.length}
        />
      </TableCaption>
      <Thead>
        <Tr background="galt">
          <Th>Réseau</Th>
          <Th>Nom du CFA</Th>
          <Th>UAI</Th>
          <Th>Siret</Th>
          <Th>Supprimer un reseau CFA</Th>
        </Tr>
      </Thead>
      <Tbody>
        {itemsSliced?.map(({ id, nom_reseau, nom_etablissement, uai, siret }) => {
          return (
            <Tr key={id}>
              <Td color="bluefrance">{nom_reseau}</Td>
              <Td color="grey.800">{nom_etablissement}</Td>
              <Td color="grey.800">{uai}</Td>
              <Td color="grey.800">{siret}</Td>
              <Td color="grey.800">
                <Button
                  variant="secondary"
                  onClick={() => {
                    toast({
                      title: "Le réseau cfa a bien été supprimé",
                      status: "success",
                      duration: 9000,
                      isClosable: true,
                    });
                    deleteReseauxCfas.mutateAsync(id);
                  }}
                >
                  Supprimer un CFA
                </Button>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

ReseauxCfasTable.propTypes = {
  reseauxCfas: PropTypes.array,
};

export default ReseauxCfasTable;
