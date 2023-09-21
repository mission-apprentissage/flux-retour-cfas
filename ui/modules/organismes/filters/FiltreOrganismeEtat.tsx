import { CheckboxGroup, Stack, Checkbox } from "@chakra-ui/react";

interface FiltreOrganismesEtatProps {
  value: boolean[];
  onChange: (value: boolean[]) => void;
}

function FiltreOrganismesEtat(props: FiltreOrganismesEtatProps) {
  return (
    <CheckboxGroup
      value={props.value?.map((item) => item.toString())}
      onChange={(value) => props.onChange(value.map((v: string) => (v === "true" ? true : false)))}
    >
      <Stack>
        <Checkbox value="false" key="ouvert" fontSize="mini" size="sm">
          Ouvert
        </Checkbox>
        <Checkbox value="true" key="ferme" fontSize="mini" size="sm">
          Fermé
        </Checkbox>
      </Stack>
    </CheckboxGroup>
  );
}

export default FiltreOrganismesEtat;
