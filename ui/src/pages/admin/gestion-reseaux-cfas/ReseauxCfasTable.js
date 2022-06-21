import { Box, Button, Table, TableCaption, Tbody, Td, Th, Thead, Tr, useToast } from "@chakra-ui/react";
import Pagination from "@choc-ui/paginator";
import PropTypes from "prop-types";
import React, { forwardRef } from "react";
import { useMutation, useQueryClient } from "react-query";

import { deleteReseauCfa } from "../../../common/api/tableauDeBord";
import { QUERY_KEYS } from "../../../common/constants/queryKeys";

const ReseauxCfasTable = ({ reseauxCfas }) => {
  const toast = useToast();
  const [current, setCurrent] = React.useState(1);

  const pageSize = 10;
  const offset = (current - 1) * pageSize;
  const reseauxCfasSliced = reseauxCfas?.slice(offset, offset + pageSize);

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

  const Prev = forwardRef((props, ref) => (
    <Button ref={ref} {...props}>
      <Box as="i" className="ri-arrow-left-s-line" />
    </Button>
  ));
  const Next = forwardRef((props, ref) => (
    <Button ref={ref} {...props}>
      <Box as="i" className="ri-arrow-right-s-line" />
    </Button>
  ));

  const itemRender = (_, type) => {
    if (type === "prev") {
      return Prev;
    }
    if (type === "next") {
      return Next;
    }
  };

  Prev.displayName = "prev";
  Next.displayName = "next";

  return (
    <Table variant="secondary">
      <TableCaption>
        <Pagination
          current={current}
          onChange={(page) => {
            setCurrent(page);
          }}
          pageSize={pageSize}
          total={reseauxCfas?.length}
          itemRender={itemRender}
          paginationProps={{
            display: "flex",
            pos: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
          baseStyles={{ bg: "white" }}
          activeStyles={{ bg: "bluefrance", color: "white", pointerEvents: "none" }}
          hoverStyles={{ bg: "galt", color: "grey.800" }}
        />
      </TableCaption>
      <Thead>
        <Tr background="galt">
          <Th>Réseau</Th>
          <Th>Nom du CFA</Th>
          <Th>UAI</Th>
          <Th>Sirets</Th>
          <Th>Supprimer un reseau CFA</Th>
        </Tr>
      </Thead>
      <Tbody>
        {reseauxCfasSliced?.map(({ id, nom_reseau, nom_etablissement, uai, sirets }) => {
          return (
            <Tr key={id}>
              <Td color="bluefrance">{nom_reseau}</Td>
              <Td color="grey.800">{nom_etablissement}</Td>
              <Td color="grey.800">{uai}</Td>
              <Td color="grey.800">{sirets}</Td>
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
