import { Box, HStack, Stack, Text, Tooltip } from "@chakra-ui/react";
import PropTypes from "prop-types";

import { donneesApprenantsFields } from "../../../../common/domain/donneesApprenants.js";

const UploadFileErrorsList = ({ uploadErrors, originalUploadLength }) => {
  return (
    <Stack marginTop="2w" spacing="2w">
      {uploadErrors.map((item, index) => {
        const fieldLabel = donneesApprenantsFields[item.errorField].label;
        const fieldFormat = donneesApprenantsFields[item.errorField].format;
        const fieldTooltip = donneesApprenantsFields[item.errorField].tooltip;

        const badFormatErrors = item.errorsForField.filter((error) => error?.type.includes(".base"));
        const requiredErrors = item.errorsForField.filter((error) => error?.type.includes(".required"));
        const notAllowedErrors = item.errorsForField.filter((error) => error?.type.includes("any.unknown"));

        return (
          <div key={index}>
            <Box backgroundColor="grey.100" padding="2w">
              <HStack fontSize="gamma">
                <Text fontWeight="bold" color="#FF2424">
                  {item.errorsForField.length} erreurs
                </Text>
                <Text color="black">
                  sur {fieldLabel} sur {originalUploadLength} lignes complétées
                </Text>
              </HStack>
            </Box>

            {badFormatErrors.length > 0 && (
              <Text size="epsilon" color="black">
                Le champ {fieldLabel} est <strong>erroné</strong> sur {badFormatErrors.length} lignes. Veuillez les
                corriger en respectant le format attendu : <strong>{fieldFormat}</strong>{" "}
                <Tooltip
                  background="bluefrance"
                  color="white"
                  label={
                    <Box padding="1w">
                      <Text>
                        <strong>{fieldTooltip.title}</strong>
                      </Text>
                      <Text style={{ whiteSpace: "pre-wrap" }}>{fieldTooltip.text}</Text>
                    </Box>
                  }
                  aria-label={fieldLabel}
                >
                  <Box
                    as="i"
                    className="ri-information-line"
                    fontSize="epsilon"
                    color="bluefrance"
                    marginLeft="1w"
                    verticalAlign="middle"
                  />
                </Tooltip>
              </Text>
            )}

            {requiredErrors.length > 0 && (
              <Text size="epsilon" color="black">
                Le champ {fieldLabel} est <strong>manquant</strong> sur {requiredErrors.length} lignes. Ce champ est
                obligatoire. Veuillez compléter en respectant le format attendu.
              </Text>
            )}

            {notAllowedErrors.length > 0 && (
              <Box size="epsilon" color="black">
                <Text marginTop="2w">
                  Attention une incohérence a été détectée sur le champ {fieldLabel} sur {notAllowedErrors.length}{" "}
                  lignes.
                </Text>
                <Text marginTop="2w">La saisie des dates doit respecter les règles suivantes :</Text>
                <Box marginTop="2w" marginLeft="4w">
                  <ul>
                    <li>
                      Si une <strong>date de début de contrat</strong> est fournie alors la{" "}
                      <strong>date de fin de contrat</strong> est obligatoire.
                    </li>
                    <li>
                      Si une <strong>date de début de contrat</strong> et une <strong>date de fin de contrat</strong>{" "}
                      sont fournies alors la <strong>date de fin de contrat</strong> doit être postérieure à la{" "}
                      <strong>date de début de contrat</strong>.
                    </li>
                    <li>
                      Si une <strong>date de rupture de contrat</strong> est fournie alors les{" "}
                      <strong>date de début de contrat</strong> et <strong>date de fin de contrat</strong> sont
                      obligatoires.
                    </li>
                    <li>
                      Si une <strong>date de rupture de contrat</strong> est fournie alors elle doit être postérieure à
                      la <strong>date d&apos;inscription</strong> et à la <strong>date de début de contrat</strong>.
                    </li>
                    <li>
                      Si une <strong>date de rupture de contrat</strong> est fournie alors elle doit être antérieure à
                      la <strong>date de fin de contrat</strong>.
                    </li>
                    <li>
                      Si une <strong>date de sortie</strong> est fournie alors la{" "}
                      <strong>date de rupture de contrat</strong> est obligatoire.
                    </li>
                    <li>
                      Si une <strong>date de sortie</strong> est fournie alors elle doit être postérieure à la{" "}
                      <strong>date d&apos;inscription</strong> et à la <strong>date de début de contrat</strong>.
                    </li>
                  </ul>
                </Box>
              </Box>
            )}
          </div>
        );
      })}
    </Stack>
  );
};

UploadFileErrorsList.propTypes = {
  uploadErrors: PropTypes.arrayOf(
    PropTypes.shape({
      errorField: PropTypes.string,
      errorsForField: PropTypes.array,
    })
  ),
  originalUploadLength: PropTypes.string.isRequired,
};

export default UploadFileErrorsList;
