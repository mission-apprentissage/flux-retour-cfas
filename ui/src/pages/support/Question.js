import { Box, Flex, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

const Question = ({ question, answer }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div>
      <Flex cursor="pointer" onClick={() => setShowAnswer(!showAnswer)}>
        <Box
          fontSize="gamma"
          marginRight="1v"
          color="bluefrance"
          as="i"
          paddingTop="2px"
          className={showAnswer ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
        />
        <Text fontSize="beta" fontWeight="700">
          {question}
        </Text>
      </Flex>
      {showAnswer && (
        <Box paddingX="3w" paddingY="1w">
          {answer}
        </Box>
      )}
    </div>
  );
};

Question.propTypes = {
  question: PropTypes.string.isRequired,
  answer: PropTypes.string.isRequired,
};
export default Question;
