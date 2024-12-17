import { Skeleton, Td, Tr } from "@chakra-ui/react";
import { memo } from "react";

interface Props {
  nbRows?: number;
  nbColumns?: number;
  height?: string;
}

const Cell = memo(({ height }: { height: string }) => (
  <Td>
    <Skeleton width="100%" height={height} startColor="grey.300" endColor="galt" />
  </Td>
));
Cell.displayName = "Cell";

const Row = memo(({ cols, height }: { cols: number; height: string }) => (
  <Tr>
    {Array.from({ length: cols }, (_, i) => (
      <Cell key={i} height={height} />
    ))}
  </Tr>
));
Row.displayName = "Row";

const RowsSkeleton = ({ nbRows = 5, nbColumns = 5, height = "1rem" }: Props) => (
  <>
    {Array.from({ length: nbRows }, (_, i) => (
      <Row key={i} cols={nbColumns} height={height} />
    ))}
  </>
);

export default memo(RowsSkeleton);
