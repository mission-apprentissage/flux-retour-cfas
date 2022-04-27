import { Button, Tbody, Td, Tr } from "@chakra-ui/react";
import React from "react";
import { useQuery } from "react-query";

import { fetchReseauxCfas } from "../../common/api/tableauDeBord";
import { Table } from "../../common/components";
import { _delete } from "../../common/httpClient";

const ReseauxCfasTable = () => {
  const { data, isLoading } = useQuery(["reseauxCfas"], () => fetchReseauxCfas());
  const reseauxCfasList = data;

  const handleDeleteReseauCfa = (reseauCfa) => {
    _delete(`/api/reseaux-cfas/delete/${reseauCfa}`);
    window.location.reload();
  };

  return (
    <Table headers={["Network", "Nom du CFA", "UAI", ""]} loading={isLoading}>
      <Tbody>
        {reseauxCfasList?.map(({ id, nom_reseau, nom_etablissement, uai }) => {
          return (
            <Tr key={id}>
              <Td color="bluefrance">{nom_reseau}</Td>
              <Td color="grey.800">{nom_etablissement}</Td>
              <Td color="grey.800">{uai}</Td>
              <Td color="grey.800">
                <Button variant="secondary" onClick={() => handleDeleteReseauCfa(id)}>
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
