import { Skeleton, Td, Tr } from "@chakra-ui/react";
import React from "react";

const RowsSkeleton = ({
  nbRows = 5,
  nbColumns = 5,
  height = "1rem",
}: {
  nbRows?: number;
  nbColumns?: number;
  height?: string;
}) => {
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
                  <Skeleton width="100%" height={height} startColor="grey.300" endColor="galt" />
                </Td>
              );
            })}
          </Tr>
        );
      })}
    </>
  );
};

export default RowsSkeleton;
