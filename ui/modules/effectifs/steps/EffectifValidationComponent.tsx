import { HStack, Button, Text, Box } from "@chakra-ui/react";
import { IEffectifCreationFormationSchema } from "shared/models/apis/effectifsCreationSchema";

import EffectifResumeComponent from "../EffectifResumeComponent";

interface EffectifValidationComponentProps {
  data: IEffectifCreationFormationSchema;
  onValidate: any;
  previous: any;
  next: any;
}

const EffectifValidationComponent = ({ data, previous, next, onValidate }: EffectifValidationComponentProps) => {
  const style = {
    border: "2px solid #F9F8F6",
    padding: "32px",
  };

  return (
    <>
      <Box style={style}>
        <EffectifResumeComponent />
      </Box>
      <HStack justifyContent="end">
        {previous.canGo && (
          <Button variant="secondary" onClick={() => previous.action()}>
            <Text as="span">Retour à l&apos;étape précédente</Text>
          </Button>
        )}
        {next.canGo && (
          <Button variant="primary" onClick={() => next.action()}>
            <Text as="span">Valider et créer l&apos;apprenant</Text>
          </Button>
        )}
      </HStack>
    </>
  );
};

export default EffectifValidationComponent;
