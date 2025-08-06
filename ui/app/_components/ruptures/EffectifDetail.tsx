"use client";

import Grid from "@mui/material/Grid2";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  API_EFFECTIF_LISTE,
  IEffecifMissionLocale,
  IUpdateMissionLocaleEffectif,
  IUpdateOrganismeFormationEffectif,
  SITUATION_ENUM,
} from "shared";

import { EffectifParcours } from "@/app/_components/EffectifParcours";
import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { EffectifDetailDisplay } from "@/app/_components/ruptures/EffectifDetailDisplay";
import { RightColumnSkeleton } from "@/app/_components/ruptures/effectifs/RightColumnSkeleton";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { useAuth } from "@/app/_context/UserContext";
import { _post, _put } from "@/common/httpClient";

export default function EffectifDetail({ data }: { data: IEffecifMissionLocale | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const nomListe = (searchParams?.get("nom_liste") as API_EFFECTIF_LISTE) || API_EFFECTIF_LISTE.A_TRAITER;
  const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const isCfaPage = pathname?.startsWith("/cfa/");

  function computeRedirectUrl(
    goNext: boolean,
    nextId: string | undefined,
    nomListe: API_EFFECTIF_LISTE,
    total: number | undefined
  ): string {
    const orgType = pathname && pathname.startsWith("/cfa") ? "cfa" : "mission-locale";

    if (goNext && nextId) {
      return `/${orgType}/${nextId}?nom_liste=${nomListe}`;
    }

    if (total === 1) {
      return nomListe === API_EFFECTIF_LISTE.PRIORITAIRE
        ? `/${orgType}/validation/prioritaire`
        : `/${orgType}/validation`;
    }

    return `/${orgType}`;
  }

  const updateEffectifMutation = useMutation({
    mutationFn: async ({
      effectifId,
      formData,
      goNext,
      nextId,
    }: {
      effectifId: string;
      formData: IUpdateMissionLocaleEffectif | IUpdateOrganismeFormationEffectif;
      goNext: boolean;
      nextId?: string;
    }) => {
      const organismeId = user?.organisation?.organisme_id;

      if (isCfaPage) {
        const result = await _put(`/api/v1/organismes/${organismeId}/mission-locale/effectif/${effectifId}`, formData);
        return { result, goNext, nextId };
      } else {
        const missionLocaleData = formData as IUpdateMissionLocaleEffectif;
        const result = await _post(`/api/v1/organisation/mission-locale/effectif/${effectifId}`, {
          situation: missionLocaleData.situation,
          situation_autre:
            missionLocaleData.situation === SITUATION_ENUM.AUTRE ? missionLocaleData.situation_autre : "",
          commentaires: missionLocaleData.commentaires,
          deja_connu: missionLocaleData.deja_connu,
        });
        return { result, goNext, nextId };
      }
    },
    onMutate: () => {
      setSaveStatus("loading");
    },
    onSuccess: (mutationData) => {
      setSaveStatus("success");
      queryClient.invalidateQueries(["effectif"]);

      if (mutationData.goNext || mutationData.nextId) {
        const targetUrl = computeRedirectUrl(mutationData.goNext, mutationData.nextId, nomListe, data?.total);
        setTimeout(() => router.push(targetUrl), 600);
      }
    },
    onError: () => {
      setSaveStatus("error");
    },
  });

  function handleSave(
    goNext: boolean,
    formData: IUpdateMissionLocaleEffectif | IUpdateOrganismeFormationEffectif,
    effectifId: string,
    nextId?: string
  ) {
    updateEffectifMutation.mutate({
      effectifId,
      formData,
      goNext,
      nextId,
    });
  }

  const backUrl = pathname && pathname.startsWith("/cfa") ? "/cfa" : "/mission-locale";

  return (
    <Grid container>
      <Grid
        size={{ xs: 12, md: 3 }}
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 2 },
        }}
      >
        <DsfrLink href={backUrl} arrow="left">
          Retour à la liste
        </DsfrLink>
        {data && (
          <div style={{ marginTop: "8rem" }}>
            <EffectifParcours effectif={data.effectif} />
          </div>
        )}
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
          {data && (
            <EffectifDetailDisplay
              effectifPayload={data}
              nomListe={nomListe}
              saveStatus={saveStatus}
              onSave={(goNext, formData) => handleSave(goNext, formData, data.effectif.id.toString(), data.next?.id)}
            />
          )}
        </SuspenseWrapper>
      </Grid>
    </Grid>
  );
}
