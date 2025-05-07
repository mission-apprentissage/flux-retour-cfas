"use client";

import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  API_EFFECTIF_LISTE,
  IEffecifMissionLocale,
  IMissionLocaleEffectifList,
  IUpdateMissionLocaleEffectif,
  SITUATION_ENUM,
  zApiEffectifListeEnum,
} from "shared";

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
          nom_liste: nomListe || API_EFFECTIF_LISTE.A_TRAITER,
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
  saveStatus,
  setSaveStatus,
  nomListeParam,
}: {
  effectifPayload: IEffecifMissionLocale;
  formData: IUpdateMissionLocaleEffectif;
  setFormData: (data: IUpdateMissionLocaleEffectif) => void;
  saveStatus: "idle" | "loading" | "success" | "error";
  setSaveStatus: (val: "idle" | "loading" | "success" | "error") => void;
  nomListeParam: IMissionLocaleEffectifList;
}) {
  const MIN_LOADING_TIME = 1500;
  const SUCCESS_DISPLAY_TIME = 600;
  const router = useRouter();
  const { effectif, next } = effectifPayload || {};
  const { a_traiter, injoignable } = effectif || {};

  useEffect(() => {
    if (effectif) {
      setFormData({
        situation: effectif.situation?.situation || ("" as unknown as SITUATION_ENUM),
        situation_autre: effectif.situation?.situation_autre || "",
        deja_connu: typeof effectif.situation?.deja_connu === "boolean" ? effectif.situation.deja_connu : null,
        commentaires: effectif.situation?.commentaires || "",
      });
    }
  }, [effectif, setFormData]);

  if (!effectif) {
    return <Typography sx={{ marginTop: 2 }}>Aucune donnée à afficher.</Typography>;
  }

  async function handleSave(goNext: boolean) {
    setSaveStatus("loading");
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
      success = false;
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
      setSaveStatus("error");
      return;
    }
    setSaveStatus("success");
    setTimeout(() => {
      // Si on va voir le suivant et qu'il existe
      if (goNext && next) {
        router.push(`/mission-locale/${next.id}?nom_liste=${nomListeParam}`);
      } else {
        const fallbackUrl = goNext
          ? nomListeParam === API_EFFECTIF_LISTE.PRIORITAIRE
            ? "/mission-locale/validation/prioritaire"
            : "/mission-locale/validation"
          : "/mission-locale";
        router.push(fallbackUrl);
      }
    }, SUCCESS_DISPLAY_TIME);
  }

  const isFormValid =
    formData.situation !== ("" as unknown as SITUATION_ENUM) &&
    (formData.situation !== SITUATION_ENUM.AUTRE || (formData.situation_autre?.trim() || "") !== "") &&
    formData.deja_connu !== null;

  const isSaving = saveStatus === "loading";
  const hasError = saveStatus === "error";
  const hasSuccess = saveStatus === "success";

  return (
    <>
      <EffectifInfo effectif={effectif} nomListe={nomListeParam} />
      {(a_traiter || injoignable) && (
        <FeedbackForm
          formData={formData}
          setFormData={setFormData}
          isFormValid={isFormValid}
          onSave={handleSave}
          isSaving={isSaving}
          isInjoignable={nomListeParam === API_EFFECTIF_LISTE.INJOIGNABLE}
          hasSuccess={hasSuccess}
          hasError={hasError}
        />
      )}
    </>
  );
}

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nomListeParam = searchParams?.get("nom_liste") ?? "";
  const parsed = zApiEffectifListeEnum.safeParse(nomListeParam);

  const [formData, setFormData] = useState<IUpdateMissionLocaleEffectif>({
    situation: "" as unknown as SITUATION_ENUM,
    situation_autre: "",
    commentaires: "",
    deja_connu: null,
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (!parsed.success) {
      router.push("/mission-locale");
    }
  }, [parsed, router]);

  if (!parsed.success) {
    return null;
  }

  const validatedNomListe: IMissionLocaleEffectifList = parsed.data;

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
          <EffectifDataLoader id={id} nomListe={validatedNomListe}>
            {(effectifPayload) => (
              <>
                <EffectifHeader effectifPayload={effectifPayload} nomListe={validatedNomListe} />
                <EffectifContent
                  effectifPayload={effectifPayload}
                  formData={formData}
                  setFormData={setFormData}
                  saveStatus={saveStatus}
                  setSaveStatus={setSaveStatus}
                  nomListeParam={validatedNomListe}
                />
              </>
            )}
          </EffectifDataLoader>
        </SuspenseWrapper>
      </Grid>
    </Grid>
  );
}
