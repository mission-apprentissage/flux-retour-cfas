import { Box, Flex } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../../../../common/components";
import { filtersPropTypes } from "../../../FiltersContext";
import DataFeedbackSection from "../data-feedback/DataFeedbackSection";
import CfaDetail from "./CfaDetail";
import CfaSiretsSelection from "./CfaSiretsSelection";
import withInfoCfaData from "./withInfoCfaData";

const CfaSection = ({ infosCfa, filters, loading, error }) => {
  return (
    <>
      <CfaDetail filters={filters} infosCfa={infosCfa} loading={loading} error={error}></CfaDetail>

      <Section>
        <Flex justifyContent="space-between">
          <div>{infosCfa?.sirets.length > 1 && <CfaSiretsSelection filters={filters} sirets={infosCfa?.sirets} />}</div>
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
  infosCfa: PropTypes.shape({
    sirets: PropTypes.arrayOf(PropTypes.string).isRequired,
    libelleLong: PropTypes.string.isRequired,
    reseaux: PropTypes.arrayOf(PropTypes.string).isRequired,
    domainesMetiers: PropTypes.arrayOf(PropTypes.string).isRequired,
    uai: PropTypes.string.isRequired,
    adresse: PropTypes.string.isRequired,
  }),
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default withInfoCfaData(CfaSection);
