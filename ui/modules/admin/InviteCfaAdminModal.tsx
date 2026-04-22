import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import { useState } from "react";
import { object, string, boolean } from "yup";

import { _post } from "@/common/httpClient";
import useToaster from "@/hooks/useToaster";

interface InviteCfaAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  siret: string;
  uai?: string | null;
  organismeNom: string;
  onSuccess?: () => void;
}

interface InviteResponse {
  email: string;
  organismeNom: string;
  expiresAt: string;
  warning?: string;
}

const schema = object().shape({
  email: string().trim().lowercase().email("Email invalide").required("Email requis"),
  prenom: string().trim().min(1, "Prénom requis").max(100).required("Prénom requis"),
  nom: string().trim().min(1, "Nom requis").max(100).required("Nom requis"),
  confirm: boolean().oneOf([true], "Merci de confirmer l'envoi de l'email"),
});

export default function InviteCfaAdminModal({
  isOpen,
  onClose,
  siret,
  uai,
  organismeNom,
  onSuccess,
}: InviteCfaAdminModalProps) {
  const { toastSuccess } = useToaster();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingConflict, setPendingConflict] = useState<{ email: string } | null>(null);
  const [resending, setResending] = useState(false);

  const formik = useFormik({
    initialValues: { email: "", prenom: "", nom: "", confirm: false },
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: async (values) => {
      setServerError(null);
      setPendingConflict(null);
      try {
        const res = await _post<any, InviteResponse>("/api/v1/admin/users/cfa/admin-invite", {
          email: values.email.trim().toLowerCase(),
          siret,
          ...(uai ? { uai } : {}),
          prenom: values.prenom.trim(),
          nom: values.nom.trim(),
        });
        const expireTxt = new Date(res.expiresAt).toLocaleString("fr-FR");
        toastSuccess(`Invitation envoyée à ${res.email}. Expire le ${expireTxt}.`, {
          description: res.warning,
        });
        formik.resetForm();
        onSuccess?.();
        onClose();
      } catch (err: any) {
        const msg: string = err?.json?.data?.message || err?.message || "Une erreur est survenue";
        const statusCode = err?.json?.status ?? err?.status;
        if (statusCode === 409 && msg.toLowerCase().includes("invitation")) {
          setPendingConflict({ email: values.email.trim().toLowerCase() });
        }
        setServerError(msg);
      }
    },
  });

  const handleResend = async () => {
    if (!pendingConflict) return;
    setResending(true);
    setServerError(null);
    try {
      const res = await _post<any, InviteResponse>("/api/v1/admin/users/cfa/admin-invite/resend", {
        email: pendingConflict.email,
        siret,
        ...(uai ? { uai } : {}),
      });
      const expireTxt = new Date(res.expiresAt).toLocaleString("fr-FR");
      toastSuccess(`Email renvoyé à ${res.email}. Nouvelle expiration : ${expireTxt}.`);
      formik.resetForm();
      setPendingConflict(null);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setServerError(err?.json?.data?.message || err?.message || "Échec du renvoi");
    } finally {
      setResending(false);
    }
  };

  const handleClose = () => {
    formik.resetForm();
    setServerError(null);
    setPendingConflict(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" closeOnOverlayClick={!formik.isSubmitting}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Inviter un administrateur CFA</ModalHeader>
        <ModalCloseButton isDisabled={formik.isSubmitting} />
        <ModalBody>
          <form onSubmit={formik.handleSubmit} noValidate id="invite-cfa-admin-form">
            <VStack align="stretch" spacing={4}>
              <Box bg="#F5F5FE" p={3} borderLeft="4px solid #000091">
                <Text fontWeight="bold">{organismeNom}</Text>
                <Text fontSize="sm" color="grey.600">
                  SIRET {siret}
                  {uai ? ` · UAI ${uai}` : ""}
                </Text>
              </Box>

              <FormControl isRequired isInvalid={!!formik.errors.email && formik.touched.email}>
                <FormLabel htmlFor="email">Email du destinataire</FormLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="off"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="prenom.nom@cfa.fr"
                />
                <FormErrorMessage>{formik.errors.email}</FormErrorMessage>
              </FormControl>

              <HStack align="flex-start" spacing={4}>
                <FormControl isRequired isInvalid={!!formik.errors.prenom && formik.touched.prenom}>
                  <FormLabel htmlFor="prenom">Prénom</FormLabel>
                  <Input
                    id="prenom"
                    name="prenom"
                    value={formik.values.prenom}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <FormErrorMessage>{formik.errors.prenom}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!formik.errors.nom && formik.touched.nom}>
                  <FormLabel htmlFor="nom">Nom</FormLabel>
                  <Input
                    id="nom"
                    name="nom"
                    value={formik.values.nom}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <FormErrorMessage>{formik.errors.nom}</FormErrorMessage>
                </FormControl>
              </HStack>

              <FormControl isInvalid={!!formik.errors.confirm && formik.touched.confirm}>
                <Checkbox
                  name="confirm"
                  isChecked={formik.values.confirm}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  J&apos;ai vérifié l&apos;email et je confirme l&apos;envoi de l&apos;invitation.
                </Checkbox>
                <FormErrorMessage>{formik.errors.confirm}</FormErrorMessage>
              </FormControl>

              {serverError && (
                <Alert status={pendingConflict ? "warning" : "error"}>
                  <AlertIcon />
                  <Box flex="1">
                    <Text>{serverError}</Text>
                    {pendingConflict && (
                      <Button mt={2} size="sm" variant="primary" isLoading={resending} onClick={handleResend}>
                        Renvoyer l&apos;email
                      </Button>
                    )}
                  </Box>
                </Alert>
              )}
            </VStack>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" mr={3} onClick={handleClose} isDisabled={formik.isSubmitting}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="invite-cfa-admin-form"
            variant="primary"
            isLoading={formik.isSubmitting}
            isDisabled={!formik.isValid || !formik.dirty || !formik.values.confirm}
          >
            Envoyer l&apos;invitation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
