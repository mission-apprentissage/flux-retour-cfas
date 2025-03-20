"use client";

import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { IEffecifMissionLocale, IUpdateMissionLocaleEffectif, SITUATION_ENUM } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get, _post } from "@/common/httpClient";

import { EffectifInfo } from "./_components/EffectifInfo";
import { FeedbackForm } from "./_components/FeedbackForm";
import { PageHeader } from "./_components/PageHeader";
import { RightColumnSkeleton } from "./_components/RightColumnSkeleton";

function EffectifDataLoader({ id, children }: { id: string; children: (data: any) => React.ReactNode }) {
  const { data } = useQuery(
    ["effectif", id],
    async () => {
      if (!id) return null;
      return await _get<IEffecifMissionLocale>(`/api/v1/organisation/mission-locale/effectif/${id}`);
    },
    {
      enabled: !!id,
      suspense: true,
      useErrorBoundary: true,
    }
  );
  return <>{children(data)}</>;
}

function EffectifHeader({ effectifPayload }: { effectifPayload: IEffecifMissionLocale }) {
  const { effectif, total, next, previous, currentIndex } = effectifPayload;
  const { a_traiter } = effectif || {};
  return (
    <PageHeader
      previous={previous}
      next={next}
      total={total}
      currentIndex={currentIndex}
      isLoading={!effectifPayload}
      isATraiter={a_traiter}
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
    if (!success) {
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    setHasSuccess(true);
    setTimeout(() => {
      if (goNext && next) router.push(`/mission-locale/${next.id}`);
      else router.push("/mission-locale");
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
      <Grid size={{ xs: 12, md: 3 }}>
        <DsfrLink href="/mission-locale" arrow="left">
          Retour à la liste
        </DsfrLink>
      </Grid>
      <Grid
        size={{ xs: 12, md: 9 }}
        pl={4}
        sx={{
          "--Grid-borderWidth": "1px",
          borderLeft: "var(--Grid-borderWidth) solid",
          borderColor: "var(--border-default-grey)",
        }}
      >
        <SuspenseWrapper fallback={<RightColumnSkeleton />}>
          <EffectifDataLoader id={id}>
            {(effectifPayload) => (
              <>
                <EffectifHeader effectifPayload={effectifPayload} />
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
                />
              </>
            )}
          </EffectifDataLoader>
        </SuspenseWrapper>
      </Grid>
    </Grid>
  );
}
