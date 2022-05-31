import { Box } from "@chakra-ui/react";
import React, { useState } from "react";

import {
  AskUniqueURLOrganismeFound,
  AskUniqueURLOrganismeNotFound,
  AskUniqueURLOrganismeSection,
} from "./FormSections";

export const ASKURL_FORM_STATE = {
  askOrganisme: "askOrganisme",
  organismeFound: "organismeFound",
  organismeNotFound: "organismeNotFound",
};

const AskUniqueURLContent = () => {
  const [formState, setFormState] = useState(ASKURL_FORM_STATE.askOrganisme);
  return (
    <Box>
      {formState === ASKURL_FORM_STATE.askOrganisme && (
        <AskUniqueURLOrganismeSection
          setOrganismeFound={() => setFormState(ASKURL_FORM_STATE.organismeFound)}
          setOrganismeNotFound={() => setFormState(ASKURL_FORM_STATE.organismeNotFound)}
        />
      )}
      {formState === ASKURL_FORM_STATE.organismeFound && <AskUniqueURLOrganismeFound />}
      {formState === ASKURL_FORM_STATE.organismeNotFound && <AskUniqueURLOrganismeNotFound />}
    </Box>
  );
};

export default AskUniqueURLContent;
