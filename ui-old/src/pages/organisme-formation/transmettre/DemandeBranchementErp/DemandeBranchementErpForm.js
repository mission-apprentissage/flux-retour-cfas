import { FormControl, FormErrorMessage, FormLabel, Select, Stack } from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import React from "react";
import * as Yup from "yup";

import { ERP_STATE, ERPS_FORM_CASES } from "../../../../common/constants/erps";
import { uaiRegex } from "../../../../common/domain/uai";
import {
  DemandeBranchementErpFormErpComingSection,
  DemandeBranchementErpFormErpOnGoingSection,
  DemandeBranchementErpFormErpReadySection,
  DemandeBranchementErpFormNoErpSection,
  DemandeBranchementErpFormOtherErpSection,
} from "./FormSections";

const formInitialValues = {
  erpIndex: 0,
  nom_organisme: "",
  uai_organisme: "",
  nb_apprentis: "",
  email_demandeur: "",
  is_ready_co_construction: false,
  autre_erp_nom: "",
};

const ErpSelectionList = [{ name: "Sélectionnez une option", state: null }].concat(ERPS_FORM_CASES);

const DemandeBranchementErpForm = ({ onSubmit }) => {
  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={Yup.object().shape({
        nom_organisme: Yup.string().required("Requis"),
        uai_organisme: Yup.string().matches(uaiRegex, "UAI invalide").required("Requis"),
        nb_apprentis: Yup.string(),
        email_demandeur: Yup.string().email("Format d'email invalide").required("Requis"),
        is_ready_co_construction: Yup.bool(),
        autre_erp_nom: Yup.string(),
      })}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, values }) => (
        <Form>
          <Stack spacing="2w">
            <Field name="erpIndex">
              {({ field, meta }) => (
                <FormControl isRequired isInvalid={meta.error && meta.touched}>
                  <FormLabel color="grey.800">ERP ou logiciel de gestion utilisé</FormLabel>
                  <Select {...field}>
                    {ErpSelectionList.map((erp, index) => (
                      <option key={index} value={index}>
                        {erp.name}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{meta.error}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
          </Stack>

          {/* Cas ERP Ready */}
          {ErpSelectionList[values.erpIndex].state === ERP_STATE.ready && (
            <DemandeBranchementErpFormErpReadySection helpFilePath={ErpSelectionList[values.erpIndex].helpFilePath} />
          )}

          {/* Cas ERP OnGoing */}
          {ErpSelectionList[values.erpIndex].state === ERP_STATE.ongoing && (
            <DemandeBranchementErpFormErpOnGoingSection isSubmitting={isSubmitting} />
          )}

          {/* Cas ERP Coming */}
          {ErpSelectionList[values.erpIndex].state === ERP_STATE.coming && (
            <DemandeBranchementErpFormErpComingSection isSubmitting={isSubmitting} />
          )}

          {/* Cas Other ERP */}
          {ErpSelectionList[values.erpIndex].state === ERP_STATE.otherErp && (
            <DemandeBranchementErpFormOtherErpSection isSubmitting={isSubmitting} />
          )}

          {/* Cas No ERP */}
          {ErpSelectionList[values.erpIndex].state === ERP_STATE.noErp && (
            <DemandeBranchementErpFormNoErpSection isSubmitting={isSubmitting} />
          )}
        </Form>
      )}
    </Formik>
  );
};

DemandeBranchementErpForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default DemandeBranchementErpForm;
