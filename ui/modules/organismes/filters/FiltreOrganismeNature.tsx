import { CheckboxGroup, Stack, Checkbox } from "@chakra-ui/react";

interface FiltreOrganismesNatureProps {
  value: string[];
  onChange: (value: string[]) => void;
}

function FiltreOrganismesNature(props: FiltreOrganismesNatureProps) {
  return (
    <CheckboxGroup value={props.value} onChange={(value) => props.onChange(value.map((v: string) => v))}>
      <Stack>
        <Checkbox value="responsable" key="responsable" fontSize="mini" size="sm">
          Responsable
        </Checkbox>
        <Checkbox value="formateur" key="formateur" fontSize="mini" size="sm">
          Formateur
        </Checkbox>
        <Checkbox value="responsable_formateur" key="responsable_formateur" fontSize="mini" size="sm">
          Responsable formateur
        </Checkbox>
      </Stack>
    </CheckboxGroup>
  );
}

export default FiltreOrganismesNature;
