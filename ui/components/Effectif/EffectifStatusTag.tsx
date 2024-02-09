import { Tag } from "@chakra-ui/react";
import { STATUT_APPRENANT_LABEL_MAP } from "shared";

interface EffectifStatutTagProps {
  nature: keyof typeof STATUT_APPRENANT_LABEL_MAP;
}

const unknownColor = "#FFE8E5";
const EffectifStatutTag = ({ nature }: EffectifStatutTagProps) => {
  return (
    <Tag
      bg={STATUT_APPRENANT_LABEL_MAP[nature] ? STATUT_APPRENANT_LABEL_MAP[nature].color : unknownColor}
      borderRadius="20px"
      px={3}
      py={1}
      maxWidth="min-content"
      display="inline"
    >
      {" "}
      {STATUT_APPRENANT_LABEL_MAP[nature] ? STATUT_APPRENANT_LABEL_MAP[nature].label : "Inconnue"}
    </Tag>
  );
};

export default EffectifStatutTag;
