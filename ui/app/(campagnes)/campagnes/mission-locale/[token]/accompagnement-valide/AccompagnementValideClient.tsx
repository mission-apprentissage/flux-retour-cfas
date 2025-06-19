"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { AuthError, _get, _post } from "@/common/httpClient";
import { capitalizeWords } from "@/common/utils/stringUtils";

import { MissionLocaleFaq } from "../../_components/faq";
import { MissionLocaleQuestion } from "../../_components/question";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[.\-\s]?\d{2}){4}$/, "Numéro de téléphone invalide");

function PhoneForm({
  label,
  phoneValue,
  setPhoneValue,
  onSave,
  phoneError,
}: {
  label: string;
  phoneValue: string;
  setPhoneValue: (val: string) => void;
  onSave: () => void;
  phoneError: string;
}) {
  return (
    <Stack spacing={2}>
      <Input
        label={label}
        nativeInputProps={{
          placeholder: "Ex : 06 12 34 56 78",
          value: phoneValue,
          onChange: (e) => setPhoneValue(e.target.value),
        }}
        style={{ marginBottom: fr.spacing("2w") }}
        state={phoneError ? "error" : undefined}
        stateRelatedMessage={phoneError}
      />
      <Button onClick={onSave}>Enregistrer</Button>
    </Stack>
  );
}

export default function AccompagnementValideClient({ token }: { token: string }) {
  const router = useRouter();
  const { token: _paramToken } = useParams() as { token: string };
  const [state, setState] = useState({
    phone: "",
    newPhone: "",
    changePhoneOpen: false,
    hasPhoneChanged: false,
    phoneError: "",
  });

  const { data, error, isLoading, isError } = useQuery(
    ["ml-effectif", token],
    () => _get(`/api/v1/campagne/mission-locale/${token}`),
    {
      enabled: !!token,
      keepPreviousData: true,
      retry: false,
      onError(err) {
        if (err instanceof AuthError) {
          router.push("/campagnes/mission-locale/lien-invalide");
        }
      },
    }
  );

  useEffect(() => {
    if (data?.telephone) {
      setState((prev) => ({ ...prev, phone: data.telephone }));
    }
  }, [data]);

  const updatePhoneMutation = useMutation((telephone: string) =>
    _post(`/api/v1/campagne/mission-locale/${token}/telephone`, { telephone })
  );

  const handleSavePhone = () => {
    const result = phoneSchema.safeParse(state.newPhone);
    if (!result.success) {
      setState((prev) => ({ ...prev, phoneError: result.error.errors[0].message }));
      return;
    }
    updatePhoneMutation.mutate(state.newPhone.trim(), {
      onSuccess: () => {
        setState((prev) => ({
          ...prev,
          phone: state.newPhone.replace(/(.{2})/g, "$1 ").trim(),
          newPhone: "",
          changePhoneOpen: false,
          hasPhoneChanged: true,
          phoneError: "",
        }));
      },
    });
  };

  if (isLoading || (isError && error instanceof AuthError)) {
    return (
      <Stack justifyContent="center" alignItems="center" sx={{ height: "100vh" }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (isError && !(error instanceof AuthError)) {
    return <Typography color="error">Une erreur est survenue.</Typography>;
  }

  return (
    <Stack spacing={3}>
      <Stack justifyContent="end" alignItems="center">
        <Box
          component="img"
          src="/images/support_solid.svg"
          alt="Accompagner les apprentis"
          sx={{
            height: "180px",
            userSelect: "none",
            marginBottom: "16px",
            marginLeft: "auto",
          }}
        />
      </Stack>
      <Typography variant="h2" sx={{ color: "var(--text-title-blue-france)" }}>
        C&apos;est noté !
      </Typography>
      <Stack p={{ xs: 2, md: 4 }} spacing={2} sx={{ background: "var(--background-alt-blue-france)" }}>
        {!state.phone ? (
          <Stack spacing={2}>
            <Typography fontWeight="bold">
              Malheureusement, votre organisme de formation ne nous a pas communiqué de numéro où vous joindre.
            </Typography>
            <PhoneForm
              label="Merci de renseigner votre nouveau numéro"
              phoneValue={state.newPhone}
              setPhoneValue={(val) => setState((prev) => ({ ...prev, newPhone: val }))}
              onSave={handleSavePhone}
              phoneError={state.phoneError}
            />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography fontWeight="bold">
              La Mission Locale {capitalizeWords(data.missionLocale.nom)} va vous contacter au numéro suivant :
            </Typography>
            <Badge noIcon severity="error">
              {state.phone}
            </Badge>
            {!state.hasPhoneChanged && (
              <DsfrLink
                href="#"
                arrow="none"
                onClick={() => setState((prev) => ({ ...prev, changePhoneOpen: !prev.changePhoneOpen }))}
                className={`fr-link--icon-right ${state.changePhoneOpen ? "ri-arrow-drop-up-line" : "ri-arrow-drop-down-line"}`}
              >
                Ce n&apos;est pas mon numéro
              </DsfrLink>
            )}
            {state.changePhoneOpen && (
              <PhoneForm
                label="Merci de renseigner votre nouveau numéro"
                phoneValue={state.newPhone}
                setPhoneValue={(val) => setState((prev) => ({ ...prev, newPhone: val }))}
                onSave={handleSavePhone}
                phoneError={state.phoneError}
              />
            )}
          </Stack>
        )}
      </Stack>
      <MissionLocaleQuestion />
      <MissionLocaleFaq
        missionLocalNom={data?.missionLocale?.nom}
        organismeNom={data?.organismeNom}
        missionLocaleUrl={data?.missionLocale?.url}
        lbaUrl={data?.lbaUrl}
      />
    </Stack>
  );
}
