import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { _get } from "../common/httpClient";
import useAuth from "./useAuth";
import { useRecoilState } from "recoil";
import { organismeMineAtom, organismeNavigationAtom } from "./organismeAtoms";

const fetchMyOrganisme = async (my_organisme_id, accountIsNotReady = false) => {
  if (!my_organisme_id || accountIsNotReady) return { myOrganisme: null };
  try {
    const myOrganisme = await _get(`/api/v1/organisme/entity/${my_organisme_id}?organisme_id=${my_organisme_id}`);
    return { myOrganisme };
  } catch (e) {
    if (e.statusCode === 404) {
      return { myOrganisme: null };
    } else {
      console.log({ e });
    }
    return { myOrganisme: null };
  }
};

export function useEspace() {
  const router = useRouter();
  let [auth] = useAuth();

  const [isloaded, setIsLoaded] = useState(false);
  const [isReloaded, setIsReloaded] = useState(false);
  const [error, setError] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);

  const [myOrganisme, setMyOrganisme] = useRecoilState(organismeMineAtom);
  const [navigation, setNavigation] = useRecoilState(organismeNavigationAtom);

  const { part, slug = [] } = router.query;
  const isMonOrganismePages = part === "mon-organisme";
  const isOrganismePages = part === "organisme";
  const isMesOrganismesPages = router.asPath.includes("/mon-espace/mes-organismes");
  const isMonOrganismePage = isMonOrganismePages && !slug.length;
  const isEffectifsPage = slug.includes("effectifs");
  const isTeleversementPage = isEffectifsPage && slug.includes("televersement");
  const isSIFA2Page = slug.includes("enquete-SIFA2");
  const isParametresPage = slug.includes("parametres");
  const contextNav = isOrganismePages ? "organisme" : "user";
  const whoIs = auth.roles.find((role) => ["pilot", "erp", "of", "reseau_of"].includes(role));

  const organisme_id = isOrganismePages
    ? slug?.[slug.length - (isTeleversementPage ? 3 : isEffectifsPage || isSIFA2Page || isParametresPage ? 2 : 1)]
    : null;
  const hasAccessToOnlyOneOrganisme = auth.organisme_ids.length === 1;
  const userIsAnOrganisme = !!auth.main_organisme_id;

  useEffect(() => {
    const abortController = new AbortController();
    setIsReloaded(false);

    fetchMyOrganisme(auth.main_organisme_id, auth.account_status !== "CONFIRMED" || auth.isInPendingValidation)
      .then(({ myOrganisme }) => {
        if (!abortController.signal.aborted) {
          const mesOrganismesNames = {
            pilot: "Sur mon territoire",
            erp: "Les organismes connectés",
            of: "Mes organismes",
            reseau_of: "Mon réseau",
            ...(hasAccessToOnlyOneOrganisme ? {} : { global: "Tous les organismes" }),
          };

          const navigation = {
            user: {
              landingEspace: {
                pageTitle: "Mon tableau de bord",
                navTitle: "Mon tableau de bord",
                path: "/mon-espace/mon-organisme",
              },
              ...(userIsAnOrganisme
                ? {
                    effectifs: {
                      pageTitle: "Mes effectifs",
                      navTitle: "Mes effectifs",
                      path: "/mon-espace/mon-organisme/effectifs",
                    },
                    televersement: {
                      pageTitle: "Téversement(s) de fichier(s)",
                      navTitle: "Téversement(s) de fichier(s)",
                      path: "/mon-espace/mon-organisme/effectifs/televersement",
                    },
                    sifa2: {
                      pageTitle: "Mon enquête SIFA2",
                      navTitle: "Mon enquête SIFA2",
                      path: "/mon-espace/mon-organisme/enquete-SIFA2",
                    },
                    parametres: {
                      pageTitle: "Mes paramètres",
                      navTitle: "Mes paramètres",
                      path: "/mon-espace/mon-organisme/parametres",
                    },
                  }
                : {}),
              ...(!hasAccessToOnlyOneOrganisme || auth.permissions.is_cross_organismes
                ? {
                    mesOrganismes: {
                      pageTitle: mesOrganismesNames[whoIs] ?? mesOrganismesNames.global,
                      navTitle: mesOrganismesNames[whoIs] ?? mesOrganismesNames.global,
                      path: "/mon-espace/mes-organismes",
                    },
                  }
                : {}),
            },
            organisme: {
              landingEspace: {
                pageTitle: "Son tableau de bord",
                navTitle: "Son tableau de bord",
                path: `/mon-espace/organisme/${organisme_id}`,
              },
              effectifs: {
                pageTitle: "Ses effectifs",
                navTitle: "Ses effectifs",
                path: `/mon-espace/organisme/${organisme_id}/effectifs`,
              },
              televersement: {
                pageTitle: "Téversement(s) de fichier(s)",
                navTitle: "Téversement(s) de fichier(s)",
                path: `/mon-espace/organisme/${organisme_id}/effectifs/televersement`,
              },
              sifa2: {
                pageTitle: "Son enquête SIFA2",
                navTitle: "Son enquête SIFA2",
                path: `/mon-espace/organisme/${organisme_id}/enquete-SIFA2`,
              },
              parametres: {
                pageTitle: "Ses paramètres",
                navTitle: "Ses paramètres",
                path: `/mon-espace/organisme/${organisme_id}/parametres`,
              },
            },
          };

          let breadcrumbResult = [
            { title: navigation[contextNav].landingEspace.navTitle, to: navigation[contextNav].landingEspace.path },
          ];

          if (isEffectifsPage) {
            if (isTeleversementPage) {
              breadcrumbResult.push({
                title: navigation[contextNav].effectifs?.navTitle,
                to: navigation[contextNav].effectifs?.path,
              });
              breadcrumbResult.push({ title: navigation[contextNav].televersement?.navTitle });
            } else breadcrumbResult.push({ title: navigation[contextNav].effectifs?.navTitle });
          }
          if (isSIFA2Page) breadcrumbResult.push({ title: navigation[contextNav].sifa2?.navTitle });
          if (isParametresPage) breadcrumbResult.push({ title: navigation[contextNav].parametres?.navTitle });

          setBreadcrumb(breadcrumbResult);
          setNavigation(navigation);
          setMyOrganisme(myOrganisme);
          setIsReloaded(true);
          setIsLoaded(true);
        }
      })
      .catch((e) => {
        if (!abortController.signal.aborted) {
          setError(e);
          setIsReloaded(false);
          setIsLoaded(false);
        }
      });
    return () => {
      abortController.abort();
    };
  }, [
    auth.main_organisme_id,
    contextNav,
    hasAccessToOnlyOneOrganisme,
    isEffectifsPage,
    isParametresPage,
    isSIFA2Page,
    organisme_id,
    setNavigation,
    setMyOrganisme,
    userIsAnOrganisme,
    whoIs,
    auth.isInPendingValidation,
    auth.account_status,
    isTeleversementPage,
    auth.permissions.is_cross_organismes,
  ]);

  if (error !== null) {
    throw error;
  }

  return {
    organisme_id,
    whoIs,
    navigation,
    isloaded,
    isReloaded,
    myOrganisme,
    breadcrumb,
    isMonOrganismePages,
    isOrganismePages,
    isMesOrganismesPages,
    isMonOrganismePage,
    isEffectifsPage,
    isTeleversementPage,
    isSIFA2Page,
    isParametresPage,
  };
}
