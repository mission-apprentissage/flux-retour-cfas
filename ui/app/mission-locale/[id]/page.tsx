"use client";

import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { API_EFFECTIF_LISTE, IEffecifMissionLocale, IUpdateMissionLocaleEffectif, SITUATION_ENUM } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get, _post } from "@/common/httpClient";

import { EffectifInfo } from "./_components/EffectifInfo";
import { FeedbackForm } from "./_components/FeedbackForm";
import { PageHeader } from "./_components/PageHeader";
import { RightColumnSkeleton } from "./_components/RightColumnSkeleton";

function EffectifDataLoader({
  id,
  nomListe,
  children,
}: {
  id: string;
  nomListe: string;
  children: (data: any) => React.ReactNode;
}) {
  const { data } = useQuery(
    ["effectif", id, nomListe],
    async () => {
      if (!id) return null;

      return await _get<IEffecifMissionLocale>(`/api/v1/organisation/mission-locale/effectif/${id}`, {
        params: {
          nom_liste: nomListe || undefined,
        },
      });
    },
    {
      enabled: !!id,
      suspense: true,
      useErrorBoundary: true,
    }
  );

  return <>{children(data)}</>;
}

function EffectifHeader({ effectifPayload, nomListe }: { effectifPayload: IEffecifMissionLocale; nomListe: string }) {
  const { effectif, total, next, previous, currentIndex } = effectifPayload;
  const { a_traiter } = effectif || {};
  return (
    <PageHeader
      previous={previous || undefined}
      next={next || undefined}
      total={total}
      currentIndex={currentIndex}
      isLoading={!effectifPayload}
      isATraiter={a_traiter}
      nomListe={nomListe}
    />
  );
}

function EffectifContent({
  effectifPayload,
  formData,
  setFormData,
  isSaving,
  setIsSaving,
  hasError,
  setHasError,
  hasSuccess,
  setHasSuccess,
  isListPrioritaire,
}: {
  effectifPayload: IEffecifMissionLocale;
  formData: IUpdateMissionLocaleEffectif;
  setFormData: (data: IUpdateMissionLocaleEffectif) => void;
  isSaving: boolean;
  setIsSaving: (val: boolean) => void;
  hasError: boolean;
  setHasError: (val: boolean) => void;
  hasSuccess: boolean;
  setHasSuccess: (val: boolean) => void;
  isListPrioritaire: boolean;
}) {
  const MIN_LOADING_TIME = 1500;
  const SUCCESS_DISPLAY_TIME = 600;
  const router = useRouter();
  const { effectif, next } = effectifPayload || {};
  const { a_traiter } = effectif || {};

  if (!effectif) {
    return <Typography sx={{ marginTop: 2 }}>Aucune donnée à afficher.</Typography>;
  }

  async function handleSave(goNext: boolean) {
    setIsSaving(true);
    setHasError(false);
    setHasSuccess(false);
    const startTime = Date.now();

    let success = false;
    try {
      await _post(`/api/v1/organisation/mission-locale/effectif/${effectif.id}`, {
        situation: formData.situation,
        situation_autre: formData.situation === SITUATION_ENUM.AUTRE ? formData.situation_autre : "",
        commentaires: formData.commentaires,
        deja_connu: formData.deja_connu,
      });
      success = true;
    } catch (e) {
      console.error("Error while saving data:", e);
      setHasError(true);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MIN_LOADING_TIME - elapsedTime;

      if (remainingTime > 0) {
        setTimeout(() => handleResult(success, goNext), remainingTime);
      } else {
        handleResult(success, goNext);
      }
    }
  }

  function handleResult(success: boolean, goNext: boolean) {
    setIsSaving(false);

    if (!success) return;

    setHasSuccess(true);

    setTimeout(() => {
      if (goNext && next) {
        const nextUrl = `/mission-locale/${next.id}${isListPrioritaire ? `?nom_liste=${API_EFFECTIF_LISTE.PRIORITAIRE}` : ""}`;
        router.push(nextUrl);
      } else {
        const fallbackUrl = isListPrioritaire ? "/mission-locale/validation/prioritaire" : "/mission-locale/validation";
        router.push(fallbackUrl);
      }
    }, SUCCESS_DISPLAY_TIME);
  }

  const isFormValid =
    formData.situation !== ("" as unknown as SITUATION_ENUM) &&
    (formData.situation !== SITUATION_ENUM.AUTRE || (formData.situation_autre?.trim() || "") !== "") &&
    formData.deja_connu !== null;

  return (
    <>
      <EffectifInfo effectif={effectif} />
      {a_traiter && (
        <FeedbackForm
          formData={formData}
          setFormData={setFormData}
          isFormValid={isFormValid}
          onSave={handleSave}
          isSaving={isSaving}
          hasSuccess={hasSuccess}
          hasError={hasError}
        />
      )}
    </>
  );
}

export default function Page() {
  const searchParams = useSearchParams();
  const nomListeParam = searchParams?.get("nom_liste");

  const [formData, setFormData] = useState<IUpdateMissionLocaleEffectif>({
    situation: "" as unknown as SITUATION_ENUM,
    situation_autre: "",
    commentaires: "",
    deja_connu: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasSuccess, setHasSuccess] = useState(false);
  const params = useParams();
  const id = params?.id as string;

  return (
    <Grid container>
      <Grid
        size={{ xs: 12, md: 3 }}
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 2 },
        }}
      >
        <DsfrLink href="/mission-locale" arrow="left">
          Retour à la liste
        </DsfrLink>
      </Grid>

      <Grid
        size={{ xs: 12, md: 9 }}
        sx={{
          borderLeft: "1px solid",
          borderColor: "var(--border-default-grey)",
          pl: { xs: 2, md: 6 },
          pr: { xs: 2, md: 2 },
          py: { xs: 2, md: 2 },
        }}
      >
        <SuspenseWrapper fallback={<RightColumnSkeleton />}>
          <EffectifDataLoader id={id} nomListe={nomListeParam || ""}>
            {(effectifPayload) => (
              <>
                <EffectifHeader effectifPayload={effectifPayload} nomListe={nomListeParam || ""} />
                <EffectifContent
                  effectifPayload={effectifPayload}
                  formData={formData}
                  setFormData={setFormData}
                  isSaving={isSaving}
                  setIsSaving={setIsSaving}
                  hasError={hasError}
                  setHasError={setHasError}
                  hasSuccess={hasSuccess}
                  setHasSuccess={setHasSuccess}
                  isListPrioritaire={nomListeParam === API_EFFECTIF_LISTE.PRIORITAIRE}
                />
              </>
            )}
          </EffectifDataLoader>
        </SuspenseWrapper>
      </Grid>
    </Grid>
  );
}
