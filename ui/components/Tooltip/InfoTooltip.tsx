import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  IconButton,
} from "@chakra-ui/react";
import { ReactNode } from "react";

import { InfoCircle } from "@/theme/components/icons";

interface InfoTooltipProps {
  contentComponent: () => ReactNode;
  headerComponent?: () => ReactNode;
  [key: string]: any;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ headerComponent, contentComponent, ...rest }) => (
  <Popover>
    <PopoverTrigger>
      <IconButton
        colorScheme="transparent"
        aria-label="Information"
        fontSize="0.8rem"
        height={6}
        minWidth={6}
        width={6}
        p={0}
        icon={<InfoCircle w="14px" h="14px" color="grey.700" fontWeight="normal" />}
        onClick={(e) => {
          e.stopPropagation();
        }}
        {...rest}
      />
    </PopoverTrigger>
    <PopoverContent boxShadow="md" whiteSpace="normal">
      <PopoverArrow />
      {headerComponent && (
        <PopoverHeader color="black" fontSize={16} fontWeight="bold">
          {headerComponent()}
        </PopoverHeader>
      )}
      {contentComponent && (
        <PopoverBody color="black" fontSize={16} fontWeight="normal" p={5}>
          {contentComponent()}
        </PopoverBody>
      )}
    </PopoverContent>
  </Popover>
);
