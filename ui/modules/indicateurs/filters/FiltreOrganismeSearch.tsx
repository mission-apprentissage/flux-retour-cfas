import { Input } from "@chakra-ui/react";

interface FiltreOrganismeSearchProps {
  value: string;
  onChange: (value: string) => void;
}
function FiltreOrganismeSearch(props: FiltreOrganismeSearchProps) {
  return (
    <Input
      variant="outline"
      placeholder="UAI/SIRET"
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    />
  );
}

export default FiltreOrganismeSearch;
