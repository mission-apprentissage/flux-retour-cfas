import { CheckboxGroup, Stack, Checkbox } from "@chakra-ui/react";

interface FiltreOrganismesNatureProps {
  value: string[];
  onChange: (value: string[]) => void;
}

function FiltreOrganismesNature(props: FiltreOrganismesNatureProps) {
  return (
    <CheckboxGroup value={props.value} onChange={(value) => props.onChange(value.map((v: string) => v))}>
      <Stack>
        <Checkbox value="responsable" key="responsable" fontSize="caption">
          Responsable
        </Checkbox>
        <Checkbox value="formateur" key="formateur" fontSize="caption">
          Formateur
        </Checkbox>
        <Checkbox value="responsable_formateur" key="responsable_formateur" fontSize="caption">
          Responsable formateur
        </Checkbox>
      </Stack>
    </CheckboxGroup>
  );
}

export default FiltreOrganismesNature;
