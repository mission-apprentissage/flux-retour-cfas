import { Box, Button, Flex, Input, Heading } from "@chakra-ui/react";
import { useFormik } from "formik";
import React, { useState } from "react";
import { object, string } from "yup";

import { _post } from "@/common/httpClient";
import withAuth from "@/components/withAuth";
import useToaster from "@/hooks/useToaster";
import { MissionLocaleSelect } from "@/modules/auth/inscription/components/MissionLocaleSelect";

async function inviteUserToOrganisation(email: string, mission_locale_id: number) {
  await _post("/api/v1/admin/users/mission-locale/membre", {
    email,
    mission_locale_id,
  });
}

interface InvitationFormProps {
  onInvitation?: () => any;
}

const InvitationFormAdmin = (props: InvitationFormProps) => {
  const { toastSuccess, toastError } = useToaster();
  const [organisation, setOrganisation] = useState<{ ml_id: number } | null>(null);
  const { values, handleChange, handleSubmit, errors, touched, resetForm } = useFormik({
    initialValues: {
      userEmail: "",
    },
    enableReinitialize: true,
    validationSchema: object().shape({
      userEmail: string().email("L'email n'est pas au bon format").required("L'email est obligatoire"),
    }),
    onSubmit: async (form) => {
      try {
        if (!organisation) {
          return;
        }
        await inviteUserToOrganisation(form.userEmail, organisation.ml_id);
        resetForm();
        toastSuccess("Un email d'invitation a été envoyé au destinataire.");
        props.onInvitation?.();
      } catch (err) {
        console.error(err);
        toastError(err?.json?.data?.message || "Oups, une erreur est survenue, merci de réessayer plus tard");
      }
    },
  });

  const onOrganisationSet = (organisation) => {
    setOrganisation(organisation);
  };

  return (
    <Box my={4} border="1px" borderColor="#000091" py="32px" px="40px">
      <Heading as="h2" color="#417DC4" fontSize="xl" fontWeight="700">
        Inviter un membre dans une mission locale
      </Heading>
      <MissionLocaleSelect setOrganisation={onOrganisationSet} />
      <Flex flexDirection="column" pt={5} minWidth="max-content">
        <Flex gap={4} minWidth="max-content">
          <Box flex="1">
            <Input
              size={"md"}
              type="email"
              name="userEmail"
              onChange={handleChange}
              value={values["userEmail"]}
              required
              placeholder="Renseigner un courriel"
              variant="outline"
              isInvalid={!!errors.userEmail && touched.userEmail}
              outlineOffset="0px"
              _focus={{
                boxShadow: "none",
                outlineColor: "none",
              }}
              _focusVisible={{
                boxShadow: "none",
                outline: "2px solid",
                outlineColor: !!errors.userEmail && touched.userEmail ? "error" : "#2A7FFE",
              }}
              _invalid={{
                borderBottomColor: "error",
                boxShadow: "none",
                outline: "2px solid",
                outlineColor: "error",
              }}
            />
            {!!errors.userEmail && touched.userEmail && (
              <Box color="tomato" my={2}>
                {errors.userEmail}
              </Box>
            )}
          </Box>
          <Box flex="1">
            <Button
              size={"md"}
              type="submit"
              variant={values.userEmail !== "" ? "primary" : "secondary"}
              onClick={handleSubmit as any}
              loadingText="Enregistrement des modifications"
              isDisabled={values.userEmail === "" || !organisation}
              px={6}
            >
              Inviter
            </Button>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};

export default withAuth(InvitationFormAdmin, ["ADMINISTRATEUR"]);
