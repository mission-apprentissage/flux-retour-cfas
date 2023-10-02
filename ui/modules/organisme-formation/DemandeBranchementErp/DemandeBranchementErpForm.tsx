import { FormControl, FormErrorMessage, FormLabel, Select, Stack } from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import React from "react";
import { ERP_STATE, ERPS_FORM_CASES } from "shared";
import * as Yup from "yup";

import { UAI_REGEX } from "@/common/domain/uai";

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

const ErpSelectionList: any = [{ name: "Sélectionnez une option", state: null }].concat(ERPS_FORM_CASES as any);

const DemandeBranchementErpForm = ({ onSubmit }: { onSubmit: (values: any) => void }) => {
  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={Yup.object().shape({
        nom_organisme: Yup.string().required("Requis"),
        uai_organisme: Yup.string().matches(UAI_REGEX, "UAI invalide").required("Requis"),
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

export default DemandeBranchementErpForm;
