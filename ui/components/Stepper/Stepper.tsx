import { Box, Heading, HStack, VStack, StackProps } from "@chakra-ui/react";
import React from "react";

type StepperProps = {
  currentStep: number;
  maxStep: number;
  title: string;
  nextTitle?: string;
} & StackProps;

export default function Stepper(props: StepperProps) {
  const { currentStep, maxStep, title, nextTitle, ...rest } = props;

  return (
    <VStack gap={2} alignItems="baseline" {...rest}>
      <Box as="h6" color="grey.800">
        Étape {currentStep} sur {maxStep}
      </Box>
      <Heading as="h1" variant="h1" fontSize="gamma">
        {title}
      </Heading>

      <HStack gap={"1px"}>
        {Array(maxStep)
          .fill(null)
          .map((_, index) => (
            <Box
              key={index}
              backgroundColor={index < currentStep ? "bluefrance" : "grey.200"}
              height={2}
              width={"110px"}
            >
              &nbsp;
            </Box>
          ))}
      </HStack>
      {nextTitle && (
        <Box color="mgalt">
          <b>Étape suivante :</b> {nextTitle}
        </Box>
      )}
    </VStack>
  );
}
