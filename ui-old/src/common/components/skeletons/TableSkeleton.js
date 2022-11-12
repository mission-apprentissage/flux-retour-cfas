import { Table, Tbody, Th, Thead, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import RowsSkeleton from "./RowsSkeleton";

const TableSkeleton = ({ headers, nbRows = 5 }) => {
  return (
    <Table marginTop="2w">
      <Thead>
        <Tr background="galt">
          {headers.map((header) => {
            return (
              <Th
                textTransform="initial"
                textColor="grey.800"
                backgroundColor="galt"
                fontSize="epsilon"
                fontWeight="700"
                paddingY="3w"
                letterSpacing="0px"
                borderBottom="2px solid"
                borderBottomColor="bluefrance"
                key={header}
              >
                {header}
              </Th>
            );
          })}
        </Tr>
      </Thead>
      <Tbody>
        <RowsSkeleton nbRows={nbRows} nbColumns={headers.length} />
      </Tbody>
    </Table>
  );
};

TableSkeleton.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  nbRows: PropTypes.number,
};

export default TableSkeleton;
