import { CheckboxGroup, Stack, Checkbox } from "@chakra-ui/react";

interface FiltreOrganismeTransmissionProps {
  fieldName: string;
  value: boolean[];
  onChange: (value: boolean[]) => void;
}

function FiltreOrganismeTransmission(props: FiltreOrganismeTransmissionProps) {
  return (
    <CheckboxGroup
      value={props.value?.map((item) => item.toString())}
      onChange={(value) => props.onChange(value.map((v: string) => (v === "true" ? true : false)))}
    >
      <Stack>
        <Checkbox value="true" key={`${props.fieldName}_true`} fontSize="caption">
          Transmets ou a déja transmis
        </Checkbox>
        <Checkbox value="false" key={`${props.fieldName}_false`} fontSize="caption">
          Ne transmets pas
        </Checkbox>
      </Stack>
    </CheckboxGroup>
  );
}

export default FiltreOrganismeTransmission;
