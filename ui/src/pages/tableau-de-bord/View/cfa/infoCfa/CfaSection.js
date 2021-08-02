import { Box, Flex } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../../../../common/components";
import { filtersPropTypes } from "../../../FiltersContext";
import DataFeedbackSection from "../data-feedback/DataFeedbackSection";
import CfaDetail from "./CfaDetail";
import { infosCfaPropType } from "./propTypes";
import SousEtablissementSelection from "./SousEtablissementSelection";
import withInfoCfaData from "./withInfoCfaData";

const CfaSection = ({ infosCfa, filters, loading, error }) => {
  return (
    <>
      <CfaDetail filters={filters} infosCfa={infosCfa} loading={loading} error={error}></CfaDetail>

      <Section>
        <Flex justifyContent="space-between">
          <div>
            {infosCfa?.sousEtablissements.length > 1 && (
              <SousEtablissementSelection filters={filters} sousEtablissements={infosCfa.sousEtablissements} />
            )}
          </div>
          <Box justifySelf="flex-end">
            <DataFeedbackSection uai={infosCfa?.uai} />
          </Box>
        </Flex>
      </Section>
    </>
  );
};

CfaSection.propTypes = {
  filters: filtersPropTypes.state,
  infosCfa: infosCfaPropType,
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default withInfoCfaData(CfaSection);
