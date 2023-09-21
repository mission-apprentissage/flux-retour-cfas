import { CheckboxGroup, Stack, Checkbox } from "@chakra-ui/react";

interface FiltreYesNoProps {
  fieldName: string;
  value: boolean[];
  onChange: (value: boolean[]) => void;
}

function FiltreYesNo(props: FiltreYesNoProps) {
  return (
    <CheckboxGroup
      value={props.value?.map((item) => item.toString())}
      onChange={(value) => props.onChange(value.map((v: string) => (v === "true" ? true : false)))}
    >
      <Stack>
        <Checkbox value="true" key={`${props.fieldName}_true`} fontSize="mini" size="sm">
          Oui
        </Checkbox>
        <Checkbox value="false" key={`${props.fieldName}_false`} fontSize="mini" size="sm">
          Non
        </Checkbox>
      </Stack>
    </CheckboxGroup>
  );
}

export default FiltreYesNo;
