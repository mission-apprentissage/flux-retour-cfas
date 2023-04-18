import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Link,
} from "@chakra-ui/react";
import { ReactNode, useState } from "react";

export interface AccordionItemProp {
  title: string;
  content: ReactNode;
}

interface Props {
  items: AccordionItemProp[];
}

export const BaseAccordionGroup = ({ items }: Props) => {
  const [indexArray, setIndexArray] = useState<number[]>([]);
  const [isUnfold, setIsUnfold] = useState(false);

  const toggleFoldAll = () => {
    setIndexArray(isUnfold ? [] : items.map((_, index) => index));
    setIsUnfold(!isUnfold);
  };

  const toggleFold = (indexNumber: number) => {
    const myIndex = indexArray?.indexOf(indexNumber);
    if (myIndex !== -1) {
      const newIndexArray = indexArray?.filter((item) => {
        return item !== indexNumber;
      });
      setIndexArray(newIndexArray);
    } else {
      setIndexArray([...indexArray, indexNumber]);
    }
  };

  return (
    <Flex flexDirection="column">
      <Link textAlign="end" color="bluefrance" fontSize="omega" onClick={() => toggleFoldAll()}>
        {!isUnfold ? "Tout déplier" : "Tout replier"}
      </Link>
      <Accordion marginTop="2w" index={indexArray} allowMultiple fontSize="zeta" color="#000000">
        {items.map((item, index) => (
          <AccordionItem key={index} onClick={() => toggleFold(index)} border="1px solid #E3E3FD" borderRadius="4px">
            <AccordionButton>
              <Box fontSize={["14px", "delta", "delta"]} flex="1" textAlign="left" color="#3A3A3A">
                {item.title}
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel paddingBottom={4}>{item.content}</AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Flex>
  );
};
