import { VStack, Text, Button, HStack, Box } from "@chakra-ui/react";
import { useState, useMemo, ComponentType } from "react";

interface Step {
  title: string;
  component: ComponentType;
}

interface StepperComponentProps {
  steps: Array<Step>;
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
const StepperComponent = ({ steps }: StepperComponentProps) => {
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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = useMemo(() => steps[currentStepIndex], [currentStepIndex]);
  const nextStep = useMemo(
    () => (currentStepIndex + 1 < steps.length ? steps[currentStepIndex + 1] : null),
    [currentStepIndex]
  );

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
      <currentStep.component />
      <HStack justifyContent="end">
        {currentStepIndex > 0 && (
          <Button variant="secondary" onClick={() => setCurrentStepIndex(currentStepIndex - 1)} type="submit">
            <Text as="span">Retour à l&apos;étape suivante</Text>
          </Button>
        )}
        {nextStep && (
          <Button variant="primary" onClick={() => setCurrentStepIndex(currentStepIndex + 1)} type="submit">
            <Text as="span">Enregistrer et passer à l&apos;étape suivante</Text>
          </Button>
        )}
      </HStack>
    </Box>
  );
};

export default StepperComponent;
