import { SystemProps, Tag } from "@chakra-ui/react";

import { NATURE_ORGANISME } from "@/common/constants/organismes";

interface NatureOrganismeTagProps extends SystemProps {
  nature: keyof typeof NATURE_ORGANISME;
}

const natureToTagColor: Record<keyof typeof NATURE_ORGANISME, string> = {
  formateur: "#FCEEAC",
  responsable: "#E3E3FD",
  responsable_formateur: "#E6FEDA",
  lieu_formation: "#FFE8E5",
  inconnue: "#FFE8E5",
};

function NatureOrganismeTag({ nature, ...props }: NatureOrganismeTagProps) {
  return (
    <Tag
      bg={natureToTagColor[nature] ?? natureToTagColor.inconnue}
      borderRadius="20px"
      px={3}
      py={1}
      maxWidth="min-content"
      whiteSpace={nature === "inconnue" || !NATURE_ORGANISME[nature] ? "nowrap" : "normal"}
      {...props}
    >
      {NATURE_ORGANISME[nature] ?? "⚠ Inconnue"}
    </Tag>
  );
}
export default NatureOrganismeTag;
