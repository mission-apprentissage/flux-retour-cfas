import { HStack, Button, Text } from "@chakra-ui/react";
import { IEffectifCreationFormationSchema } from "shared/models/apis/effectifsCreationSchema";

interface EffectifFormationComponentProps {
  data: IEffectifCreationFormationSchema;
  onValidate: any;
  previous: any;
  next: any;
}

const EffectifFormationComponent = ({ data, previous, next, onValidate }: EffectifFormationComponentProps) => {
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

export default EffectifFormationComponent;
