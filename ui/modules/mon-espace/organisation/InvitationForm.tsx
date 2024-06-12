import { Box, Button, Flex, Input, Heading } from "@chakra-ui/react";
import { useFormik } from "formik";
import React from "react";
import { object, string } from "yup";

import { _post } from "@/common/httpClient";
import useToaster from "@/hooks/useToaster";

async function inviteUserToOrganisation(email: string) {
  await _post("/api/v1/organisation/membres", {
    email,
  });
}

interface InvitationFormProps {
  onInvitation?: () => any;
}

const InvitationForm = (props: InvitationFormProps) => {
  const { toastSuccess, toastError } = useToaster();
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
        await inviteUserToOrganisation(form.userEmail);
        resetForm();
        toastSuccess("Un email d'invitation a été envoyé au destinataire.");
        props.onInvitation?.();
      } catch (err) {
        console.error(err);
        toastError(err?.json?.data?.message || "Oups, une erreur est survenue, merci de réessayer plus tard");
      }
    },
  });

  return (
    <Box my={4} border="1px" borderColor="#000091" py="32px" px="40px">
      <Heading as="h2" color="#417DC4" fontSize="xl" fontWeight="700">
        Inviter un membre de votre organisme
      </Heading>
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
          {/* <Box>
      <Select
        name="roleName"
        md={size}
        onChange={handleChange}
        iconColor={"gray.800"}
        data-testid={"actions-roles"}
        w="300px"
        value={values.roleName}
      >
        {roles.map((role) => (
          <option key={role.name} value={role.name}>
            {role.title}
          </option>
        ))}
      </Select>
      {errors.roleName && touched.roleName && (
        <Box color="tomato" my={2}>
          {errors.roleName}
        </Box>
      )}
    </Box> */}
          <Box flex="1">
            <Button
              size={"md"}
              type="submit"
              variant={values.userEmail !== "" ? "primary" : "secondary"}
              onClick={handleSubmit as any}
              loadingText="Enregistrement des modifications"
              isDisabled={values.userEmail === ""}
              px={6}
            >
              Inviter
            </Button>
          </Box>
        </Flex>
        {/* <Text textStyle="xs">
          <Question w="10px" h="10px" mt="-0.2rem" /> Une question sur un rôle ? Consulter la{" "}
          <Link
            color="bluefrance"
            as={NavLink}
            href={"/docs/faq"}
            isExternal
          >
            FAQ
          </Link>
        </Text> */}
      </Flex>
    </Box>
  );
};

export default InvitationForm;
