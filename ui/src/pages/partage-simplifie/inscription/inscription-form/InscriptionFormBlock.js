import { Box, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";

import AlertBlock from "../../../../common/components/AlertBlock/AlertBlock.js";
import { AlertErrorBlock } from "../../../../common/components/index.js";
import SituationOrganismeInscription from "../SituationOrganismeInscription.js";
import InscriptionForm from "./InscriptionForm.js";
import { INSCRIPTION_FORM_STATE } from "./InscriptionFormStates.js";
import useSubmitInscription from "./useSubmitInscription.js";

const InscriptionFormBlock = ({ organisme }) => {
  const { uai, siret, siren, nom_etablissement, nature, adresse, reseaux, academie, region } = organisme;
  const { formState, submitInscription } = useSubmitInscription({
    uai,
    siret,
    nom_etablissement,
    adresse_etablissement: adresse,
  });

  return (
    <>
      {formState === INSCRIPTION_FORM_STATE.INITIAL && (
        <>
          <SituationOrganismeInscription
            uai={uai}
            siret={siret}
            siren={siren}
            nom_etablissement={nom_etablissement}
            nature={nature}
            adresse_etablissement={adresse}
            reseaux={reseaux}
            academie={academie}
            region={region}
          />

          <Box width="70%" backgroundColor="#E3E3FD" padding="4w" marginTop="6w">
            <Stack>
              <Box marginBottom="2w">
                <Text fontSize="gamma" fontWeight="700" color="bluefrance" marginBottom="4w">
                  Veuillez compléter les informations suivantes pour créer votre compte :
                </Text>
                <InscriptionForm onSubmit={submitInscription} />
              </Box>
            </Stack>
          </Box>
        </>
      )}

      {formState === INSCRIPTION_FORM_STATE.ERROR && <AlertErrorBlock />}
      {formState === INSCRIPTION_FORM_STATE.SUCCESS && (
        <AlertBlock width="50%" variant="success">
          <Text>
            <strong>Merci.</strong>
          </Text>
          <Text>
            L’équipe Partage Simplifié fera le nécessaire rapidement pour vous envoyer un lien vous permettant de
            définir un mot de passe et activer votre compte.
          </Text>
        </AlertBlock>
      )}
    </>
  );
};

InscriptionFormBlock.propTypes = {
  organisme: PropTypes.shape({
    uai: PropTypes.string.isRequired,
    siren: PropTypes.string.isRequired,
    siret: PropTypes.string.isRequired,
    nature: PropTypes.string.isRequired,
    nom_etablissement: PropTypes.string.isRequired,
    reseaux: PropTypes.arrayOf(PropTypes.string).isRequired,
    adresse: PropTypes.string.isRequired,
    region: PropTypes.string.isRequired,
    academie: PropTypes.string.isRequired,
  }).isRequired,
};

export default InscriptionFormBlock;
