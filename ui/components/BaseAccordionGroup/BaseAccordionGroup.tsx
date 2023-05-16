import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  AccordionProps,
  Box,
  Flex,
  FlexProps,
  Link,
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import { useState } from "react";

type BaseAccordionGroupProps = {
  items: any[];
  TextColor?: string;
  [x: string]: any;
} & AccordionProps;

export const BaseAccordionGroup = ({
  items,
  TextColor = "#3A3A3A",
  backgroundColor,
  ...rest
}: BaseAccordionGroupProps) => {
  const [indexArray, setIndexArray] = useState<number[]>([]);
  const [isUnfold, setIsUnfold] = useState(false);
  const indexItemArray = items.map((item) => items.indexOf(item));

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
      <Accordion
        marginTop="2w"
        index={indexArray}
        allowMultiple
        fontSize="zeta"
        color="#000000"
        {...rest}
        backgroundColor={backgroundColor}
      >
        {items.map((item, index) => (
          <AccordionItem key={index} onClick={() => updateIndex(index)}>
            <AccordionButton>
              <Box fontSize={["14px", "delta", "delta"]} flex="1" textAlign="left" color={TextColor}>
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

BaseAccordionGroup.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      content: PropTypes.node.isRequired,
    }).isRequired
  ).isRequired,
  TextColor: PropTypes.string,
};
