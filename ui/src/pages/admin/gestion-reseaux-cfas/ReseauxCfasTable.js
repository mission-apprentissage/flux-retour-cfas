import { Button, Tbody, Td, Tr, useToast } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { useMutation, useQueryClient } from "react-query";

import { deleteReseauCfa } from "../../../common/api/tableauDeBord";
import { Table } from "../../../common/components";
import { QUERY_KEYS } from "../../../common/constants/queryKeys";

const ReseauxCfasTable = ({ reseauxCfas }) => {
  const toast = useToast();

  const queryClient = useQueryClient();
  const deleteReseauxCfas = useMutation(
    (reseauCfa) => {
      return deleteReseauCfa(reseauCfa);
    },
    {
      onSuccess() {
        queryClient.invalidateQueries([QUERY_KEYS.RESEAUX_CFAS]);
      },
    }
  );

  return (
    <Table headers={["Réseau", "Nom du CFA", "UAI", ""]}>
      <Tbody>
        {reseauxCfas?.map(({ id, nom_reseau, nom_etablissement, uai_etablissement }) => {
          return (
            <Tr key={id}>
              <Td color="bluefrance">{nom_reseau}</Td>
              <Td color="grey.800">{nom_etablissement}</Td>
              <Td color="grey.800">{uai_etablissement}</Td>
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
