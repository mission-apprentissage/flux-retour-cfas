import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, Flex, Text } from "@chakra-ui/react";

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
        <Text fontSize="gamma" fontWeight="700">
          {question}
        </Text>
      </Flex>
      {showAnswer && (
        <Box paddingX="3w" fontSize="epsilon" paddingY="1w">
          {answer}
        </Box>
      )}
    </div>
  );
};

Question.propTypes = {
  question: PropTypes.string.isRequired,
  answer: PropTypes.object.isRequired,
};
export default Question;
