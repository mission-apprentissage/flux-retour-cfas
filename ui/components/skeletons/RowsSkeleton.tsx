import { Skeleton, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const RowsSkeleton = ({ nbRows = 5, nbColumns = 5, height }) => {
  const rows = Array.from({ length: nbRows }, (_, i) => i);
  const columns = Array.from({ length: nbColumns }, (_, j) => j);

  return (
    <>
      {rows.map((i) => {
        return (
          <Tr textAlign="left" key={i}>
            {columns.map((j) => {
              return (
                <Td key={j}>
                  <Skeleton width="100%" height="1rem" startColor="grey.300" endColor="galt" h={height} />
                </Td>
              );
            })}
          </Tr>
        );
      })}
    </>
  );
};

RowsSkeleton.propTypes = {
  nbRows: PropTypes.number,
  nbColumns: PropTypes.number,
};

export default RowsSkeleton;
