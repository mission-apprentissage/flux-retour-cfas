import { HStack, Button, Text } from "@chakra-ui/react";
import { IEffectifCreationContratsSchema } from "shared/models/apis/effectifsCreationSchema";

interface EffectifContratsComponentProps {
  data: IEffectifCreationContratsSchema;
  onValidate: any;
  previous: any;
  next: any;
}

const EffectifContratsComponent = ({ data, previous, next, onValidate }: EffectifContratsComponentProps) => {
  return (
    <>
      <HStack justifyContent="end">
        {previous.canGo && (
          <Button variant="secondary" onClick={() => previous.action()}>
            <Text as="span">Retour à l&apos;étape précédente</Text>
          </Button>
        )}
        {next.canGo && (
          <Button variant="primary" onClick={() => next.action()}>
            <Text as="span">Enregistrer et passer à l&apos;étape suivante</Text>
          </Button>
        )}
      </HStack>
    </>
  );
};

export default EffectifContratsComponent;
