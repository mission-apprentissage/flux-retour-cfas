import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
} from "@chakra-ui/react";

interface BasicTooltipProps {
  triggerComponent: any;
  headerComponent?: any;
  contentComponent: any;
}
const BasicTooltip = ({ triggerComponent, headerComponent, contentComponent }: BasicTooltipProps) => (
  <Popover>
    <PopoverTrigger>{triggerComponent()}</PopoverTrigger>
    <PopoverContent minW={{ base: "100%", lg: "max-content" }} padding={3}>
      <PopoverArrow />
      <PopoverCloseButton color="black" />
      {headerComponent && <PopoverHeader>{headerComponent()}</PopoverHeader>}
      <PopoverBody>{contentComponent()}</PopoverBody>
    </PopoverContent>
  </Popover>
);

export default BasicTooltip;
