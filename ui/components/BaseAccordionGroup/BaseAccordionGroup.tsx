import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, Flex, Button } from "@chakra-ui/react";
import { useState } from "react";

interface BaseAccordionGroupProps {
  AccordionItemsDetailList: {
    title: string | JSX.Element;
    content: JSX.Element;
  }[];
  textColor?: string;
}
export const BaseAccordionGroup = ({ AccordionItemsDetailList, textColor = "#3A3A3A" }: BaseAccordionGroupProps) => {
  const [indexArray, setIndexArray] = useState<number[]>([]);
  const [isUnfold, setIsUnfold] = useState(false);
  const indexItemArray = AccordionItemsDetailList.map((item) => AccordionItemsDetailList.indexOf(item));

  const unfoldAll = () => {
    setIndexArray(indexItemArray);
    setIsUnfold(true);
  };

  const foldAll = () => {
    setIndexArray([]);
    setIsUnfold(false);
  };

  const updateIndex = (indexNumber: number) => {
    const myIndex = indexArray?.indexOf(indexNumber);
    if (myIndex !== -1) {
      const newIndexArray = indexArray?.filter((item) => {
        return item !== indexNumber;
      });
      return setIndexArray(newIndexArray);
    } else return setIndexArray([...indexArray, indexNumber]);
  };

  return (
    <Flex flexDirection="column" marginTop="2w">
      <Button
        variant="link"
        textAlign="end"
        color="bluefrance"
        fontSize="omega"
        px={0}
        py={0}
        justifyContent="left"
        onClick={() => (!isUnfold ? unfoldAll() : foldAll())}
      >
        {!isUnfold ? "Tout déplier" : "Tout replier"}
      </Button>
      <Accordion variant="withBorder" marginTop="2w" index={indexArray} allowMultiple fontSize="zeta" color="#000000">
        {AccordionItemsDetailList.map((item, index) => (
          <AccordionItem key={index}>
            {({ isExpanded }) => (
              <>
                <AccordionButton onClick={() => updateIndex(index)}>
                  <Box fontSize={["14px", "delta", "delta"]} flex="1" textAlign="left" color={textColor}>
                    {item.title}
                  </Box>

                  {isExpanded ? (
                    <MinusIcon fontSize="12px" color="#000091" />
                  ) : (
                    <AddIcon fontSize="12px" color="#000091" />
                  )}
                </AccordionButton>
                <AccordionPanel paddingBottom={4} fontSize="16px">
                  {item.content}
                </AccordionPanel>
              </>
            )}
          </AccordionItem>
        ))}
      </Accordion>
    </Flex>
  );
};
