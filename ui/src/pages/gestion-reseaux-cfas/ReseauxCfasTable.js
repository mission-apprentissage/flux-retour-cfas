import { Button, Tbody, Td, Tr } from "@chakra-ui/react";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

import { deleteReseauCfa, fetchReseauxCfas } from "../../common/api/tableauDeBord";
import { Table } from "../../common/components";

const ReseauxCfasTable = () => {
  const { data, isLoading } = useQuery(["reseauxCfas"], () => fetchReseauxCfas());
  const reseauxCfasList = data;

  const queryClient = useQueryClient();
  const deleteReseauxCfas = useMutation(
    (reseauCfa) => {
      return deleteReseauCfa(reseauCfa);
    },
    {
      onSuccess() {
        // invalidate users query so react-query refetch the list for us
        // see https://react-query.tanstack.com/guides/query-invalidation#query-matching-with-invalidatequeries
        queryClient.invalidateQueries(["reseauxCfas"]);
      },
    }
  );
  return (
    <Table headers={["Réseau", "Nom du CFA", "UAI", ""]} loading={isLoading}>
      <Tbody>
        {reseauxCfasList?.map(({ id, nom_reseau, nom_etablissement, uai }) => {
          return (
            <Tr key={id}>
              <Td color="bluefrance">{nom_reseau}</Td>
              <Td color="grey.800">{nom_etablissement}</Td>
              <Td color="grey.800">{uai}</Td>
              <Td color="grey.800">
                <Button variant="secondary" onClick={() => deleteReseauxCfas.mutateAsync(id)}>
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

export default ReseauxCfasTable;
