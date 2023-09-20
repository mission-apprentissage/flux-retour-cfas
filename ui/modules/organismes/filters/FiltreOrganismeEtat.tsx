import { CheckboxGroup, Stack, Checkbox } from "@chakra-ui/react";

interface FiltreOrganismesEtatProps {
  value: string[];
  onChange: (value: string[]) => void;
}

function FiltreOrganismesEtat(props: FiltreOrganismesEtatProps) {
  return (
    <CheckboxGroup value={props.value} onChange={(value) => props.onChange(value.map((v: string) => v))}>
      <Stack>
        <Checkbox value="ouvert" key="ouvert" fontSize="caption">
          Ouvert
        </Checkbox>
        <Checkbox value="ferme" key="ferme" fontSize="caption">
          Fermé
        </Checkbox>
      </Stack>
    </CheckboxGroup>
  );
}

export default FiltreOrganismesEtat;
