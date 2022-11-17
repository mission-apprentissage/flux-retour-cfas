import { Box, Link } from "@chakra-ui/react";
import React, { useState } from "react";

import CfaTransmissionFound from "./FormSections/CfaTransmissionFound.jsx";
import CfaTransmissionNotFound from "./FormSections/CfaTransmissionNotFound.jsx";
import CfaTransmissionSection from "./FormSections/CfaTransmissionSection.jsx";

export const ASKURL_FORM_STATE = {
  askOrganisme: "askOrganisme",
  organismeFound: "organismeFound",
  organismeNotFound: "organismeNotFound",
};

const CheckCfaTransmissionContent = () => {
  const [formState, setFormState] = useState(ASKURL_FORM_STATE.askOrganisme);
  return (
    <Box>
      {formState === ASKURL_FORM_STATE.askOrganisme && (
        <CfaTransmissionSection
          setOrganismeFound={() => setFormState(ASKURL_FORM_STATE.organismeFound)}
          setOrganismeNotFound={() => setFormState(ASKURL_FORM_STATE.organismeNotFound)}
        />
      )}
      {formState !== ASKURL_FORM_STATE.askOrganisme && (
        <Link variant="underline" marginTop="2w" onClick={() => setFormState(ASKURL_FORM_STATE.askOrganisme)}>
          <Box as="i" className="ri-arrow-left-line" marginRight="3v" />
          Retour
        </Link>
      )}
      {formState === ASKURL_FORM_STATE.organismeFound && <CfaTransmissionFound />}
      {formState === ASKURL_FORM_STATE.organismeNotFound && <CfaTransmissionNotFound />}
    </Box>
  );
};

export default CheckCfaTransmissionContent;
