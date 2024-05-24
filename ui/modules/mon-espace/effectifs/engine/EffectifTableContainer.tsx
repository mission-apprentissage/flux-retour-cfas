import { Box, HStack, Text } from "@chakra-ui/react";
import { UseQueryResult } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useState } from "react";

import { DoubleChevrons } from "@/theme/components/icons/DoubleChevrons";

import EffectifsTable from "./EffectifsTable";

interface EffectifsTableContainerProps {
  effectifs: any[];
  modeSifa?: boolean;
  canEdit?: boolean;
  searchValue?: string;
  triggerExpand: object;
  onTriggerExpand: Dispatch<SetStateAction<{ tableId: string; rowId: string }>>;
  tableId: string;
  formation: any;
  refetch: (options: { throwOnError: boolean; cancelRefetch: boolean }) => Promise<UseQueryResult>;
}
const EffectifsTableContainer = ({
  effectifs,
  formation,
  canEdit,
  searchValue,
  triggerExpand,
  onTriggerExpand,
  tableId,
  modeSifa,
  refetch,
  ...props
}: EffectifsTableContainerProps) => {
  const [count, setCount] = useState(effectifs.length);
  return (
    <Box {...props}>
      {count !== 0 && (
        <HStack>
          <DoubleChevrons />
          <Text fontWeight="bold" textDecoration="underline">
            {formation.libelle_long}
          </Text>
          <Text>
            [Code diplôme {formation.cfd}] - [Code RNCP {formation.rncp}]
          </Text>
        </HStack>
      )}
      <EffectifsTable
        tableId={tableId}
        canEdit={canEdit}
        organismesEffectifs={effectifs}
        searchValue={searchValue}
        onCountItemsChange={(count) => setCount(count)}
        triggerExpand={triggerExpand}
        onTriggerExpand={onTriggerExpand}
        modeSifa={modeSifa}
        refetch={refetch}
      />
    </Box>
  );
};

export default EffectifsTableContainer;
