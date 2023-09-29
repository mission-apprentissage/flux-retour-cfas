import { Box, Flex, Text } from "@chakra-ui/react";
import React, { useState } from "react";

const Question = ({ question, answer }: { question: string; answer: any }) => {
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

export default Question;
