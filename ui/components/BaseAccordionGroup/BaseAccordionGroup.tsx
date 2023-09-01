import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, Flex, Link } from "@chakra-ui/react";
import PropTypes from "prop-types";
import { useState } from "react";

export const BaseAccordionGroup = ({ AccordionItemsDetailList, TextColor = "#3A3A3A" }) => {
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
      <Link textAlign="end" color="bluefrance" fontSize="omega" onClick={() => (!isUnfold ? unfoldAll() : foldAll())}>
        {!isUnfold ? "Tout déplier" : "Tout replier"}
      </Link>
      <Accordion variant="withBorder" marginTop="2w" index={indexArray} allowMultiple fontSize="zeta" color="#000000">
        {AccordionItemsDetailList.map((item, index) => (
          <AccordionItem key={index} onClick={() => updateIndex(index)}>
            {({ isExpanded }) => (
              <>
                <AccordionButton>
                  <Box fontSize={["14px", "delta", "delta"]} flex="1" textAlign="left" color={TextColor}>
                    {item.title}
                  </Box>

                  {isExpanded ? (
                    <MinusIcon fontSize="12px" color="#000091" />
                  ) : (
                    <AddIcon fontSize="12px" color="#000091" />
                  )}
                </AccordionButton>
                <AccordionPanel paddingBottom={4}>{item.content}</AccordionPanel>
              </>
            )}
          </AccordionItem>
        ))}
      </Accordion>
    </Flex>
  );
};

BaseAccordionGroup.propTypes = {
  AccordionItemsDetailList: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      content: PropTypes.node.isRequired,
    }).isRequired
  ).isRequired,
  TextColor: PropTypes.string,
};
