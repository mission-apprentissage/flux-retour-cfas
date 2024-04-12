import { VStack, Text, Button, HStack, Box } from "@chakra-ui/react";
import { useState, useMemo, ComponentType } from "react";

interface Step {
  title: string;
  component: any;
}

interface StepperComponentProps {
  steps: Array<Step>;
  data: any;
  currentStepIndex: any;
  setCurrentStepIndex: any;
}

const LinearStepper = ({ index, size }) => {
  const style = {
    width: `${Math.floor(600 / size)}px`,
    height: "8px",
  };
  return (
    <HStack w="600px" my="3px">
      {new Array(size).fill(0).map((_, i) => (
        <Box key={i} style={style} backgroundColor={i <= index ? "#000091" : "#EEEEEE"}></Box>
      ))}
    </HStack>
  );
};
const StepperComponent = ({ steps, data, currentStepIndex, setCurrentStepIndex }: StepperComponentProps) => {
  const stepLabelStyle = {
    color: "#3A3A3A",
    fontSize: "14px",
  };

  const stepSubLabelStyle = {
    color: "#666",
    fontSize: "12px",
  };

  const titleStyle = {
    color: "#161616",
    fontSize: "20px",
    fontWeight: "700",
  };

  const currentStep = steps[currentStepIndex];
  const nextStep = currentStepIndex + 1 < steps.length ? steps[currentStepIndex + 1] : null;

  const previous = {
    canGo: currentStepIndex > 0,
    action: () => currentStepIndex > 0 && setCurrentStepIndex(currentStepIndex - 1),
  };

  const next = {
    canGo: true,
    action: () => {
      if (currentStepIndex + 1 < steps.length) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    },
  };

  return (
    <Box>
      <VStack alignItems={"start"}>
        <Text style={stepLabelStyle} fontWeight="400">
          Étape {currentStepIndex + 1} sur {steps.length}
        </Text>
        <Text style={titleStyle}>{currentStep.title}</Text>
        <LinearStepper index={currentStepIndex} size={steps.length} />
        <Box minH="18px">
          {nextStep ? (
            <HStack>
              <Text style={stepSubLabelStyle} fontWeight="700">
                Étape suivante :{" "}
              </Text>
              <Text style={stepSubLabelStyle} fontWeight="400">
                {nextStep.title}
              </Text>
            </HStack>
          ) : null}
        </Box>
      </VStack>
      <currentStep.component previous={previous} next={next} data={data} />
    </Box>
  );
};

export default StepperComponent;
