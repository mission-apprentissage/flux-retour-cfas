import { useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRecoilState } from "recoil";
import { organismeAtom } from "./organismeAtoms";
import { _get } from "../common/httpClient";
// import useAuth from "./useAuth";

function useOrganismeFetch(organisme_id) {
  const queryClient = useQueryClient();
  const prevOrganismeId = useRef(null);
  const [organisme, setOrganisme] = useRecoilState(organismeAtom);

  useEffect(() => {
    if (prevOrganismeId.current !== organisme_id) {
      prevOrganismeId.current = organisme_id;
      queryClient.resetQueries(["organisme"], { exact: true });
    }
  }, [queryClient, organisme_id]);

  const { data, isLoading, isFetching } = useQuery(
    ["organisme"],
    () => _get(`/api/v1/organisme/entity/${organisme_id}?organisme_id=${organisme_id}`),
    {
      refetchOnWindowFocus: false,
    }
  );

  console.log(data);
  setOrganisme(data);

  return { isLoading: isFetching || isLoading, organisme };
}

export function useOrganisme() {
  const router = useRouter();
  // let [auth] = useAuth();

  const { part, slug = [] } = router.query;
  const isMonOrganismePages = part === "mon-organisme";
  const isOrganismePages = part === "organisme";
  const isMonOrganismePage = isMonOrganismePages && !slug.length;
  const isEffectifsPage = slug.includes("effectifs");
  const isSIFA2Page = slug.includes("enquete-SIFA2");
  const isParametresPage = slug.includes("parametres");
  const organisme_id = isOrganismePages
    ? slug?.[slug.length - (isEffectifsPage || isSIFA2Page || isParametresPage ? 2 : 1)]
    : null;

  const { isLoading, organisme } = useOrganismeFetch(organisme_id);

  // const [isloaded, setIsLoaded] = useState(false);
  // const [isReloaded, setIsReloaded] = useState(false);
  // const [error, setError] = useState(null);

  // const [breadcrumbDetails, setBreadcrumbDetails] = useState([]);

  // const [paths, setPaths] = useRecoilState(organismePathsAtom);
  // const [titles, setTitles] = useRecoilState(organismeTitlesAtom);
  // const [title] = useRecoilState(organismeTitleAtom);

  // useEffect(() => {
  //   const abortController = new AbortController();
  //   setIsReloaded(false);
  //   // hydrate(organisme_id || auth.main_organisme_id)
  //   //   .then(({ organisme }) => {
  //   // if (!abortController.signal.aborted) {
  //   //   const pathTo = organisme_id
  //   //     ? `/mes-dossiers/espaces-partages/${organisme_id}`
  //   //     : dossierId
  //   //     ? `/mes-dossiers/dossiers-partages`
  //   //     : `/mes-dossiers`;
  //   //   const commonPaths = {
  //   //     base: pathTo,
  //   //     mesDossiers: `/mes-dossiers/mon-espace`,
  //   //     sharedDossiers: `/mes-dossiers/dossiers-partages`,
  //   //     parametresUtilisateurs: `${pathTo}/parametres/utilisateurs`,
  //   //     parametresNotifications: `${pathTo}/parametres/notifications`,
  //   //   };
  //   //   const paths = dossierId
  //   //     ? {
  //   //         ...commonPaths,
  //   //         dossiers: `${pathTo}`,
  //   //         dossier: `${pathTo}/:id/:step`,
  //   //         nouveauDossier: `/mes-dossiers/mon-espace/nouveau-dossier`,
  //   //       }
  //   //     : !organisme_id
  //   //     ? {
  //   //         ...commonPaths,
  //   //         dossiers: `${pathTo}/mon-espace`,
  //   //         dossier: `${pathTo}/mon-espace/:id/:step`,
  //   //         nouveauDossier: `${pathTo}/mon-espace/nouveau-dossier`,
  //   //       }
  //   //     : {
  //   //         ...commonPaths,
  //   //         dossiers: `${pathTo}/dossiers`,
  //   //         dossier: `${pathTo}/dossiers/:id/:step`,
  //   //         nouveauDossier: `${pathTo}/dossiers/nouveau-dossier`,
  //   //       };
  //   //   const titles = dossierId
  //   //     ? {
  //   //         base: "Dossiers",
  //   //         mesDossiers: "Mes dossiers",
  //   //         organisme: `${organisme?.nom}`,
  //   //         myOrganisme: "Mon espace",
  //   //         sharedOrganismes: "Espaces partagés avec moi",
  //   //         sharedDossiers: "Dossiers partagés avec moi",
  //   //         dossiers: "Dossiers partagés avec moi",
  //   //         parametres: "Paramètres",
  //   //         utilisateurs: "Utilisateurs",
  //   //         notifications: "Notifications",
  //   //         nouveauDossier: "Nouveau dossier",
  //   //         parametresUtilisateurs: "Paramètres Utilisateurs",
  //   //         parametresNotifications: "Paramètres Notifications",
  //   //         commencerNouveauDossier: "Commencer un nouveau dossier",
  //   //       }
  //   //     : !organisme_id
  //   //     ? {
  //   //         base: "Mes dossiers",
  //   //         mesDossiers: "Mes dossiers",
  //   //         organisme: "Mon espace",
  //   //         myOrganisme: "Mon espace",
  //   //         sharedOrganismes: "Espaces partagés avec moi",
  //   //         sharedDossiers: "Dossiers partagés avec moi",
  //   //         dossiers: "Mes dossiers",
  //   //         parametres: "Paramètres",
  //   //         utilisateurs: "Utilisateurs",
  //   //         notifications: "Notifications",
  //   //         nouveauDossier: "Nouveau dossier",
  //   //         parametresUtilisateurs: "Paramètres Utilisateurs",
  //   //         parametresNotifications: "Paramètres Notifications",
  //   //         commencerNouveauDossier: "Commencer un nouveau dossier",
  //   //       }
  //   //     : {
  //   //         base: "Dossiers",
  //   //         mesDossiers: "Mes dossiers",
  //   //         organisme: `${organisme?.nom}`,
  //   //         myOrganisme: "Mon espace",
  //   //         sharedOrganismes: "Espaces partagés avec moi",
  //   //         sharedDossiers: "Dossiers partagés avec moi",
  //   //         dossiers: "Espaces partagés avec moi",
  //   //         parametres: "Paramètres",
  //   //         utilisateurs: "Utilisateurs",
  //   //         notifications: "Notifications",
  //   //         nouveauDossier: "Nouveau dossier",
  //   //         parametresUtilisateurs: "Paramètres Utilisateurs",
  //   //         parametresNotifications: "Paramètres Notifications",
  //   //         commencerNouveauDossier: "Commencer un nouveau dossier",
  //   //       };
  //   //   let bcDetails = [{ title: titles.base }];
  //   //   const baseBc = organisme_id || dossierId ? [{ title: "Mes dossiers", to: "/mes-dossiers/mon-espace" }] : [];
  //   //   switch (pathname) {
  //   //     case paths.parametresUtilisateurs:
  //   //       bcDetails = [
  //   //         ...baseBc,
  //   //         { title: titles.organisme, to: paths.dossiers },
  //   //         { title: titles.parametres },
  //   //         { title: titles.utilisateurs },
  //   //       ];
  //   //       break;
  //   //     case paths.parametresNotifications:
  //   //       bcDetails = [
  //   //         ...baseBc,
  //   //         { title: titles.organisme, to: paths.dossiers },
  //   //         { title: titles.parametres, to: paths.parametresUtilisateurs },
  //   //         { title: titles.notifications },
  //   //       ];
  //   //       break;
  //   //     case paths.dossiers:
  //   //       bcDetails = [...baseBc, { title: titles.dossiers }, { title: titles.organisme }];
  //   //       break;
  //   //     case paths.sharedDossiers:
  //   //       bcDetails = [...baseBc, { title: titles.dossiers, to: paths.dossiers }, { title: titles.sharedDossiers }];
  //   //       break;
  //   //     case paths.nouveauDossier:
  //   //       bcDetails = [
  //   //         ...baseBc,
  //   //         { title: titles.dossiers, to: paths.dossiers },
  //   //         { title: titles.organisme, to: paths.dossiers },
  //   //         { title: titles.nouveauDossier },
  //   //       ];
  //   //       break;
  //   //     default:
  //   //       bcDetails = [...baseBc, { title: titles.dossiers }, { title: titles.organisme }];
  //   //       break;
  //   //   }
  //   //   // case of ${paths.dossiers}/:id/:step`
  //   //   const contratPath = new RegExp(`^${paths.dossiers}/[0-9A-Fa-f]{24}/[a-z]+$`);
  //   //   if (contratPath.test(pathname) && title) {
  //   //     bcDetails = [
  //   //       ...baseBc,
  //   //       { title: titles.dossiers, to: paths.dossiers },
  //   //       ...(!dossierId ? [{ title: titles.organisme, to: paths.dossiers }] : []),
  //   //       { title: title },
  //   //     ];
  //   //   }
  //   //   setBreadcrumbDetails(bcDetails);
  //   //   setPaths(paths);
  //   //   setTitles(titles);
  //   //   setOrganisme(organisme);
  //   //   setIsReloaded(true);
  //   //   setIsLoaded(true);
  //   // }
  //   //   })
  //   //   .catch((e) => {
  //   //     if (!abortController.signal.aborted) {
  //   //       setError(e);
  //   //       setIsReloaded(false);
  //   //       setIsLoaded(false);
  //   //     }
  //   //   });
  //   // return () => {
  //   //   abortController.abort();
  //   // };
  // }, [auth.main_organisme_id, pathname, setPaths, setTitles, setOrganisme, title, organisme_id]);

  // if (error !== null) {
  //   throw error;
  // }

  return {
    // isloaded,
    // isReloaded,
    // organisme,
    // breadcrumbDetails,
    // paths,
    // titles,

    isLoading,
    organisme_id,
    organisme,

    isMonOrganismePages,
    isOrganismePages,
    isMonOrganismePage,
    isEffectifsPage,
    isSIFA2Page,
    isParametresPage,
  };
}
