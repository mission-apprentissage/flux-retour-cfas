import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Link,
  Text,
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import { useState } from "react";
import { NavLink } from "react-router-dom";

export const BaseAccordionGroup = ({ AccordionItemsDetailList, TextColor = "#3A3A3A", isHomePage = false }) => {
  const [indexArray, setIndexArray] = useState();
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

  const updateIndex = (indexNumber) => {
    const myIndex = indexArray?.indexOf(indexNumber);
    if (myIndex !== -1) {
      const newIndexArray = indexArray?.filter((item) => {
        return item !== indexNumber;
      });
      return setIndexArray(newIndexArray);
    } else return setIndexArray([...indexArray, indexNumber]);
  };
  console.log(isHomePage);
  return (
    <Flex flexDirection="column" marginTop="2w">
      <Link textAlign="end" color="bluefrance" fontSize="omega" onClick={() => (!isUnfold ? unfoldAll() : foldAll())}>
        {!isUnfold ? "Tout déplier" : "Tout replier"}
      </Link>
      {isHomePage && <Text>Consultez les questions fréquemment posées :</Text>}
      <Accordion marginTop="2w" index={indexArray} allowMultiple fontSize="zeta" color="#000000">
        {AccordionItemsDetailList.map((item, index) => (
          <AccordionItem key={index} onClick={() => updateIndex(index)}>
            <AccordionButton>
              <Box flex="1" textAlign="left" color={TextColor} fontSize="delta">
                {item.title}
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel paddingBottom={4}>{item.content}</AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
      {isHomePage && (
        <Link as={NavLink} to="/questions-reponses" color="bluefrance" borderBottom="1px solid" width="21%">
          <Box as="i" className="ri-arrow-right-line" marginRight="1w" />
          Voir davantage de questions
        </Link>
      )}
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
  isHomePage: PropTypes.bool,
};
