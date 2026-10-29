"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { SegmentedControl, SegmentedControlProps } from "@codegouvfr/react-dsfr/SegmentedControl";
import SelectNext from "@codegouvfr/react-dsfr/SelectNext";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import { useIsMutating, useMutation, useMutationState, useQuery, useQueryClient } from "@tanstack/react-query";
import { SortingState } from "@tanstack/react-table";
import { format } from "date-fns";
import { useRef, useState } from "react";
import {
  BrancheDemandeActivation,
  estRenvoyable,
  MOTIFS_DEMANDE_ACTIVATION,
  refusAvecMail,
  StatutDemandeActivation,
  zBrancheDemandeActivation,
} from "shared/models/data/demandesActivationCfa.model";
import {
  IBilanEnvoiDemandes,
  IBilanImportDemandes,
  ICocheDemandesActivation,
  IDemandeActivationLigne,
  IDemandesActivationResponse,
  IEnvoiDemandesActivation,
  IModificationDemandeActivation,
  VUES_DEMANDES_ACTIVATION,
  VueDemandeActivation,
} from "shared/models/routes/admin/demandes-activation.api";

import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { PAGES } from "@/app/_utils/routes.utils";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminTable } from "@/app/admin/_components/AdminTable";
import { _get, _post, _put } from "@/common/httpClient";
import { getServerErrorMessage } from "@/common/rateLimit";

import { CorrectionDemandeModal, correctionModal } from "./CorrectionDemandeModal";
import styles from "./demandes-activation.module.scss";
import { nomCfa } from "./libelles";

const envoiModal = createModal({ id: "demandes-activation-envoi", isOpenedByDefault: false });

const URL_DEMANDES = "/api/v1/admin/demandes-activation";
const CLE_REQUETE = ["admin", "demandes-activation"];
const CLE_COCHE = ["admin", "demandes-activation", "a-envoyer"];
const PAGE_SIZE = 100;

type Retour = { severity: "success" | "info" | "warning" | "error"; message: string };

const MODE_D_EMPLOI = [
  "Importez l'export Google Forms (« Télécharger les réponses », .zip ou .csv), sans l'ouvrir dans Excel.",
  "Indiquez la source à l'import : elle reste attachée aux demandes créées par cet import et sert à filtrer la liste.",
  "Ré-importer un export plus récent ajoute les nouvelles réponses ; les lignes déjà envoyées ne bougent pas.",
  "Corrigez une ligne avec « Corriger » (SIRET, e-mail), jamais dans le fichier : les corrections sont gardées aux imports suivants.",
  "Cochez les lignes prêtes, puis « Envoyer les e-mails » : DECA est activé et chaque demandeur reçoit son e-mail.",
  "Les refus « sans mail » ne reçoivent rien : à traiter à la main si besoin.",
  "En cas d'échec, corrigez puis « Renvoyer ». Les relances partent automatiquement.",
];

const LIBELLES_VUES: Record<VueDemandeActivation, string> = {
  a_envoyer: "À envoyer",
  envoyees: "Envoyées",
  refus: "Refus",
  devenus_eligibles: "Devenus éligibles",
  echecs: "Échecs",
};

const VUES_COCHABLES_EN_BLOC: ReadonlyArray<VueDemandeActivation> = ["a_envoyer", "devenus_eligibles"];

const LIBELLES_BRANCHES: Record<BrancheDemandeActivation, string> = {
  activation: "Activation",
  compte_existant: "Compte existant",
  refus: "Refus",
};

const STATUTS: Record<
  StatutDemandeActivation,
  { libelle: string; severity?: "success" | "info" | "warning" | "error" }
> = {
  pret: { libelle: "Prête" },
  envoi_en_cours: { libelle: "Envoi en cours", severity: "info" },
  envoyee: { libelle: "Envoyée", severity: "success" },
  echec: { libelle: "Échec", severity: "error" },
  invitation_expiree: { libelle: "Invitation expirée", severity: "warning" },
};

const COLONNES = [
  { label: "CFA", dataKey: "cfa", width: "15%", sortable: false },
  { label: "Demandeur", dataKey: "demandeur", width: "16%", sortable: false },
  { label: "Inscrit le", dataKey: "inscription", width: "8%", sortable: true },
  { label: "Source", dataKey: "source", width: "9%", sortable: true },
  { label: "Compte", dataKey: "compte", width: "8%", sortable: false },
  { label: "Branche", dataKey: "branche", width: "9%", sortable: false },
  { label: "Motifs", dataKey: "motifs", width: "14%", sortable: false },
  { label: "Statut", dataKey: "statut", width: "8%", sortable: false },
  { label: "À envoyer", dataKey: "a_envoyer", width: "5%", sortable: false },
  { label: "Actions", dataKey: "actions", width: "8%", sortable: false },
];

const CLES_DE_TRI: Record<string, (demande: IDemandeActivationLigne) => string | null> = {
  inscription: (demande) => demande.horodatage,
  source: (demande) => demande.source,
};

function trier(demandes: IDemandeActivationLigne[], tri: SortingState) {
  const [critere] = tri;
  const cle = critere && CLES_DE_TRI[critere.id];
  if (!cle) return demandes;
  const sens = critere.desc ? -1 : 1;
  return [...demandes].sort((a, b) => {
    const valeurA = cle(a);
    const valeurB = cle(b);
    if (valeurA === null || valeurB === null) return valeurA === valeurB ? 0 : valeurA === null ? 1 : -1;
    return sens * valeurA.localeCompare(valeurB, "fr", { sensitivity: "base" });
  });
}

const emailSecable = (email: string) => {
  const arobase = email.indexOf("@");
  return arobase > 0 ? (
    <>
      {email.slice(0, arobase)}
      <wbr />
      {email.slice(arobase)}
    </>
  ) : (
    email
  );
};

const bilanImport = ({ creees, misesAJour, fusionnees, inchangees, erreurs }: IBilanImportDemandes) =>
  `${creees} demande(s) créée(s), ${misesAJour} mise(s) à jour, ${fusionnees} doublon(s) fusionné(s), ${inchangees} déjà envoyée(s) laissée(s) telle(s) quelle(s), ${erreurs} ligne(s) vide(s) ignorée(s).`;

function BadgeBranche({ demande }: { demande: IDemandeActivationLigne }) {
  if (demande.branche !== "refus") {
    return (
      <Badge className={styles.insecable} severity={demande.branche === "activation" ? "success" : "info"} small>
        {LIBELLES_BRANCHES[demande.branche]}
      </Badge>
    );
  }
  return refusAvecMail(demande.motifs) ? (
    <Badge className={styles.insecable} severity="error" small>
      Refus avec mail
    </Badge>
  ) : (
    <Badge className={styles.insecable} severity="warning" small>
      Refus sans mail
    </Badge>
  );
}

const LIBELLES_ROLES = { admin: "Rôle : admin", member: "Rôle : membre" } as const;

type EtatCompte = { libelle: string; severity: "success" | "info" | "warning"; note?: string };

function etatCompte(
  compte: NonNullable<IDemandeActivationLigne["compte"]>,
  branche: BrancheDemandeActivation
): EtatCompte {
  if (compte.account_status === "CONFIRMED") return { libelle: "Confirmé", severity: "success" };
  if (compte.account_status === "PENDING_ADMIN_VALIDATION") {
    return { libelle: "Email validé", severity: "info", note: "Compte validé à l'envoi" };
  }
  if (compte.organisation_role) {
    return { libelle: "Email à valider", severity: "warning", note: "Lien de validation renvoyé à l'envoi" };
  }
  return {
    libelle: "Non confirmé",
    severity: "warning",
    note: branche === "activation" ? "Remplacé par une invitation" : undefined,
  };
}

function BadgeCompte({ demande: { compte, branche } }: { demande: IDemandeActivationLigne }) {
  if (!compte) {
    return (
      <Badge className={styles.insecable} noIcon small>
        Sans compte
      </Badge>
    );
  }
  const { libelle, severity, note } = etatCompte(compte, branche);
  return (
    <>
      <Badge className={styles.insecable} severity={severity} small>
        {libelle}
      </Badge>
      {note && <p className="fr-text--xs fr-mb-0">{note}</p>}
      <p className="fr-text--xs fr-mb-0">
        {compte.organisation_role ? LIBELLES_ROLES[compte.organisation_role] : "Sans rôle"}
      </p>
    </>
  );
}

function Motifs({ demande }: { demande: IDemandeActivationLigne }) {
  return (
    <div id={`motifs-${demande._id}`}>
      {demande.motifs.length > 0 && (
        <ul className="fr-tags-group">
          {demande.motifs.map((motif) => (
            <li key={motif}>
              <Tooltip
                kind="hover"
                title={`${MOTIFS_DEMANDE_ACTIVATION[motif].detail}. ${
                  MOTIFS_DEMANDE_ACTIVATION[motif].avecMail
                    ? "Refus avec mail : le message « pas encore » part à l'envoi."
                    : "Refus sans mail : rien ne part, l'équipe prend contact si besoin."
                }`}
              >
                <Tag small>{MOTIFS_DEMANDE_ACTIVATION[motif].libelle}</Tag>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
      {demande.domaine_inconnu && (
        <Badge className={styles.insecable} severity="warning" small>
          Domaine inconnu
        </Badge>
      )}
      {demande.motif_echec && <p className="fr-text--xs fr-mb-0">{demande.motif_echec}</p>}
    </div>
  );
}

export default function DemandesActivationClient() {
  const queryClient = useQueryClient();
  const [vue, setVue] = useState<VueDemandeActivation>("a_envoyer");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [tri, setTri] = useState<SortingState>([]);
  const [filtreSource, setFiltreSource] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [source, setSource] = useState("");
  const [retourImport, setRetourImport] = useState<Retour | null>(null);
  const [retourLigne, setRetourLigne] = useState<Retour | null>(null);
  const [enCorrection, setEnCorrection] = useState<IDemandeActivationLigne | null>(null);
  const zoneRetour = useRef<HTMLDivElement>(null);

  const { data, error, isLoading } = useQuery<IDemandesActivationResponse>({
    queryKey: CLE_REQUETE,
    queryFn: ({ signal }) => _get(URL_DEMANDES, { signal }),
    refetchInterval: (query) =>
      query.state.data?.demandes.some((demande) => demande.statut === "envoi_en_cours") ? 5000 : false,
  });

  const importMutation = useMutation({
    mutationFn: (formulaire: FormData) =>
      _post<FormData, IBilanImportDemandes>(`${URL_DEMANDES}/import`, formulaire, {
        headers: { Accept: "application/json" },
      }),
  });

  const modificationMutation = useMutation({
    mutationFn: ({ id, modification }: { id: string; modification: IModificationDemandeActivation }) =>
      _put<IDemandeActivationLigne>(`${URL_DEMANDES}/${id}`, modification),
  });

  const importer = async () => {
    if (!fichier) return;
    const formulaire = new FormData();
    formulaire.append("fichier", fichier);
    formulaire.append("source", source);
    try {
      const bilan = await importMutation.mutateAsync(formulaire);
      setRetourImport({ severity: "success", message: bilanImport(bilan) });
      await queryClient.invalidateQueries({ queryKey: CLE_REQUETE });
    } catch (err) {
      setRetourImport({ severity: "error", message: getServerErrorMessage(err, "L'import a échoué") });
    }
  };

  const majLignes = (maj: (demande: IDemandeActivationLigne) => IDemandeActivationLigne) =>
    queryClient.setQueryData<IDemandesActivationResponse>(
      CLE_REQUETE,
      (actuelles) => actuelles && { demandes: actuelles.demandes.map(maj) }
    );

  const cocherMutation = useMutation({
    mutationKey: CLE_COCHE,
    mutationFn: (coche: ICocheDemandesActivation) =>
      _put<IDemandeActivationLigne[]>(`${URL_DEMANDES}/a-envoyer`, coche),
    onMutate: async ({ ids, a_envoyer }) => {
      await queryClient.cancelQueries({ queryKey: CLE_REQUETE });
      const visees = new Set(ids);
      const precedentes = new Map<string, boolean>();
      majLignes((demande) => {
        if (!visees.has(demande._id)) return demande;
        precedentes.set(demande._id, demande.a_envoyer);
        return { ...demande, a_envoyer };
      });
      return { precedentes };
    },
    onError: (err, _coche, contexte) => {
      majLignes((demande) => {
        const precedente = contexte?.precedentes.get(demande._id);
        return precedente === undefined ? demande : { ...demande, a_envoyer: precedente };
      });
      setRetourLigne({ severity: "error", message: getServerErrorMessage(err, "La demande n'a pas pu être modifiée") });
    },
    onSuccess: (lignes) => {
      const parId = new Map(lignes.map((ligne) => [ligne._id, ligne]));
      majLignes((demande) => parId.get(demande._id) ?? demande);
    },
  });

  const idsEnCoche = new Set(
    useMutationState({
      filters: { mutationKey: CLE_COCHE, status: "pending" },
      select: (mutation) => (mutation.state.variables as ICocheDemandesActivation | undefined)?.ids ?? [],
    }).flat()
  );
  const cocheEnCours = useIsMutating({ mutationKey: CLE_COCHE }) > 0;

  const envoiMutation = useMutation({
    mutationFn: (envoi: IEnvoiDemandesActivation) =>
      _post<IEnvoiDemandesActivation, IBilanEnvoiDemandes>(`${URL_DEMANDES}/envoyer`, envoi),
  });

  const renvoiMutation = useMutation({
    mutationFn: (id: string) => _post<undefined, IDemandeActivationLigne>(`${URL_DEMANDES}/${id}/renvoyer`),
  });

  const envoyer = async () => {
    try {
      const bilan = await envoiMutation.mutateAsync({ ids: cochees.map((demande) => demande._id) });
      setRetourLigne({
        severity: bilan.ecartees > 0 ? "warning" : "info",
        message: `${bilan.demandes} demande(s) en cours d'envoi pour ${bilan.organismes} établissement(s).${
          bilan.ecartees > 0 ? ` ${bilan.ecartees} demande(s) écartée(s) : elles ne sont plus envoyables.` : ""
        } La liste se met à jour automatiquement.`,
      });
      await queryClient.invalidateQueries({ queryKey: CLE_REQUETE });
    } catch (err) {
      setRetourLigne({ severity: "error", message: getServerErrorMessage(err, "L'envoi n'a pas pu être lancé") });
    }
    envoiModal.close();
  };

  const renvoyer = async (demande: IDemandeActivationLigne) => {
    try {
      await renvoiMutation.mutateAsync(demande._id);
      setRetourLigne({ severity: "info", message: `Envoi relancé pour ${demande.email}.` });
      await queryClient.invalidateQueries({ queryKey: CLE_REQUETE });
    } catch (err) {
      setRetourLigne({ severity: "error", message: getServerErrorMessage(err, "Le renvoi n'a pas pu être lancé") });
    }
  };

  const ouvrirCorrection = (demande: IDemandeActivationLigne) => {
    setEnCorrection({ ...demande });
    correctionModal.open();
  };

  const corriger = async (demande: IDemandeActivationLigne, modification: IModificationDemandeActivation) => {
    const corrigee = await modificationMutation.mutateAsync({ id: demande._id, modification });
    majLignes((ligne) => (ligne._id === corrigee._id ? corrigee : ligne));
    setRetourLigne({
      severity: corrigee.branche === "refus" ? "warning" : "success",
      message: `${nomCfa(corrigee)} (${corrigee.email}) : ${
        corrigee.branche === "refus"
          ? `toujours refusée : ${corrigee.motifs.map((motif) => MOTIFS_DEMANDE_ACTIVATION[motif].libelle).join(", ")}.`
          : `réévaluée en branche « ${LIBELLES_BRANCHES[corrigee.branche]} ».`
      }`,
    });
    requestAnimationFrame(() => zoneRetour.current?.focus());
  };

  const toutes = data?.demandes ?? [];
  const sources = [...new Set(toutes.map((demande) => demande.source))].sort((a, b) => a.localeCompare(b, "fr"));
  const demandesFiltrees = filtreSource ? toutes.filter((demande) => demande.source === filtreSource) : toutes;
  const demandesDeLaVue = trier(
    demandesFiltrees.filter((demande) => demande.vue === vue),
    tri
  );
  const cochees = toutes.filter((demande) => demande.a_envoyer && demande.cochable);
  const aCocherDansLaVue = demandesDeLaVue.filter((demande) => demande.cochable && !demande.a_envoyer);
  const aDecocherDansLaVue = demandesDeLaVue.filter((demande) => demande.a_envoyer);
  const compteParVue = Object.fromEntries(
    VUES_DEMANDES_ACTIVATION.map((cle) => [cle, demandesFiltrees.filter((demande) => demande.vue === cle).length])
  ) as Record<VueDemandeActivation, number>;
  const lastPage = Math.max(1, Math.ceil(demandesDeLaVue.length / pageSize));
  const currentPage = Math.min(page, lastPage);

  const tableData = demandesDeLaVue.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((demande) => ({
    _id: demande._id,
    rawData: demande,
    element: {
      cfa: (
        <>
          <strong>{nomCfa(demande)}</strong>
          <br />
          <span className="fr-text--xs">
            <span className={styles.insecable}>
              SIRET {demande.siret ?? demande.siret_saisi_brut}
              {demande.uai && " ·"}
            </span>
            {demande.uai && (
              <>
                {" "}
                <span className={styles.insecable}>UAI {demande.uai}</span>
              </>
            )}
          </span>
          {(demande.effectifs_erp !== null || demande.effectifs_deca !== null) && (
            <p className="fr-text--xs fr-mb-0">
              ERP {demande.effectifs_erp ?? 0} · DECA {demande.effectifs_deca ?? 0}
            </p>
          )}
          {demande.siret_propose && (
            <p className="fr-text--xs fr-mb-0">SIRET ouvert de même UAI : {demande.siret_propose}</p>
          )}
        </>
      ),
      demandeur: (
        <>
          {emailSecable(demande.email)}
          {demande.email_corrige && (
            <p className="fr-text--xs fr-mb-0">Saisi : {emailSecable(demande.email_saisi || "—")}</p>
          )}
          {demande.fonction && <p className="fr-text--xs fr-mb-0">{demande.fonction}</p>}
          {demande.compte && (demande.compte.prenom || demande.compte.nom) && (
            <p className="fr-text--xs fr-mb-0">
              {[demande.compte.prenom, demande.compte.nom].filter(Boolean).join(" ")}
            </p>
          )}
          {demande.commentaire && (
            <Tooltip kind="hover" title={demande.commentaire}>
              <span className="fr-text--xs">
                <span className="fr-icon-chat-3-line fr-icon--sm" aria-hidden="true" /> Remarque
              </span>
            </Tooltip>
          )}
        </>
      ),
      compte: <BadgeCompte demande={demande} />,
      inscription: demande.horodatage
        ? format(new Date(demande.horodatage), "dd/MM/yyyy HH:mm")
        : (demande.horodatage_brut ?? "—"),
      source: demande.source,
      branche: <BadgeBranche demande={demande} />,
      motifs: <Motifs demande={demande} />,
      statut: (
        <Badge
          className={styles.insecable}
          small
          severity={STATUTS[demande.statut].severity}
          noIcon={!STATUTS[demande.statut].severity}
        >
          {STATUTS[demande.statut].libelle}
        </Badge>
      ),
      a_envoyer: (
        <Checkbox
          small
          options={[
            {
              label: (
                <span className="fr-sr-only">
                  À envoyer : {nomCfa(demande)}, {demande.email}
                </span>
              ),
              nativeInputProps: {
                checked: demande.a_envoyer,
                disabled: !demande.cochable || idsEnCoche.has(demande._id),
                onChange: (event) => cocherMutation.mutate({ ids: [demande._id], a_envoyer: event.target.checked }),
                "aria-describedby": demande.cochable ? undefined : `motifs-${demande._id}`,
              },
            },
          ]}
        />
      ),
      actions:
        demande.vue === "envoyees" || demande.statut === "envoi_en_cours" ? null : (
          <div className="fr-btns-group fr-btns-group--sm fr-btns-group--icon-left">
            <Button
              priority="tertiary"
              size="small"
              iconId="fr-icon-edit-line"
              onClick={() => ouvrirCorrection(demande)}
            >
              Corriger
            </Button>
            {estRenvoyable(demande.statut) && (
              <Button
                priority="tertiary"
                size="small"
                iconId="fr-icon-refresh-line"
                onClick={() => renvoyer(demande)}
                disabled={renvoiMutation.isPending}
              >
                Renvoyer
              </Button>
            )}
          </div>
        ),
    },
  }));

  const segment = (cle: VueDemandeActivation) => ({
    label: `${LIBELLES_VUES[cle]} (${compteParVue[cle]})`,
    nativeInputProps: {
      checked: vue === cle,
      onChange: () => {
        setVue(cle);
        setPage(1);
      },
    },
  });
  const segments: SegmentedControlProps.Segments = [
    segment("a_envoyer"),
    segment("envoyees"),
    segment("refus"),
    segment("devenus_eligibles"),
    segment("echecs"),
  ];

  return (
    <>
      <Breadcrumb
        currentPageLabel={PAGES.static.adminDemandesActivation.title}
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
      />
      <AdminPageHeader
        title={PAGES.static.adminDemandesActivation.title}
        intro="Importez l'export du formulaire, vérifiez chaque demande, puis cochez celles à envoyer."
      />
      <Alert
        severity="info"
        small
        className="fr-mb-6w"
        description={
          <>
            <p className="fr-text--bold fr-mb-1w">Mode d&apos;emploi</p>
            <ul className="fr-mb-0">
              {MODE_D_EMPLOI.map((consigne) => (
                <li key={consigne}>{consigne}</li>
              ))}
            </ul>
          </>
        }
      />

      <section className="fr-mb-6w">
        <h2 className="fr-h6">Importer les réponses du formulaire</h2>
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
          <div className="fr-col-12 fr-col-md-5">
            <Upload
              label="Fichier"
              hint="Export Google Forms, .zip ou .csv, 1 Mo max"
              nativeInputProps={{
                accept: ".zip,.csv",
                onChange: (event) => {
                  const choisi = event.target.files?.[0] ?? null;
                  setFichier(choisi);
                  setRetourImport(null);
                },
              }}
            />
          </div>
          <div className="fr-col-12 fr-col-md-4">
            <Input
              label="Source"
              hintText="Campagne d'origine, par exemple Webinaire PdL du 16 octobre. Elle n'est posée que sur les nouvelles demandes."
              nativeInputProps={{
                value: source,
                list: "sources-demandes-activation",
                required: true,
                autoComplete: "off",
                onChange: (event) => setSource(event.target.value),
              }}
            />
            <datalist id="sources-demandes-activation">
              {sources.map((nom) => (
                <option key={nom} value={nom} />
              ))}
            </datalist>
          </div>
          <div className="fr-col-12 fr-col-md-3">
            <Button onClick={importer} disabled={!fichier || !source.trim() || importMutation.isPending}>
              Importer
            </Button>
          </div>
        </div>
        {retourImport && (
          <Alert
            severity={retourImport.severity}
            small
            closable
            onClose={() => setRetourImport(null)}
            description={retourImport.message}
            className="fr-mt-3w"
          />
        )}
      </section>

      {error ? (
        <Alert
          severity="error"
          title="Impossible de charger les demandes"
          description={getServerErrorMessage(error, "Une erreur est survenue, veuillez réessayer.")}
        />
      ) : isLoading ? (
        <TableSkeleton />
      ) : (
        <>
          <div className="fr-grid-row">
            <div className="fr-col-12 fr-col-md-4">
              <SelectNext
                label="Filtrer par source"
                options={[
                  { value: "", label: `Toutes les sources (${toutes.length})` },
                  ...sources.map((nom) => ({
                    value: nom,
                    label: `${nom} (${toutes.filter((demande) => demande.source === nom).length})`,
                  })),
                ]}
                nativeSelectProps={{
                  value: filtreSource,
                  onChange: (event) => {
                    setFiltreSource(event.target.value);
                    setPage(1);
                  },
                }}
              />
            </div>
          </div>
          <div className={`${styles.barreVues} fr-mb-3w`}>
            <SegmentedControl legend="Vue" hideLegend small segments={segments} />
            <Button
              iconId="fr-icon-mail-line"
              onClick={() => envoiModal.open()}
              disabled={cochees.length === 0 || envoiMutation.isPending || cocheEnCours}
            >
              Envoyer les e-mails ({cochees.length})
            </Button>
          </div>
          <div ref={zoneRetour} tabIndex={-1} aria-live="polite">
            {retourLigne && (
              <Alert
                severity={retourLigne.severity}
                small
                closable
                onClose={() => setRetourLigne(null)}
                description={retourLigne.message}
                className="fr-mb-3w"
              />
            )}
          </div>
          {VUES_COCHABLES_EN_BLOC.includes(vue) && (
            <div className="fr-btns-group fr-btns-group--inline-sm fr-btns-group--sm fr-btns-group--icon-left">
              <Button
                priority="tertiary"
                size="small"
                iconId="fr-icon-checkbox-line"
                disabled={aCocherDansLaVue.length === 0}
                onClick={() =>
                  cocherMutation.mutate({ ids: aCocherDansLaVue.map((demande) => demande._id), a_envoyer: true })
                }
              >
                Cocher toute la vue ({aCocherDansLaVue.length})
              </Button>
              <Button
                priority="tertiary"
                size="small"
                iconId="fr-icon-close-circle-line"
                disabled={aDecocherDansLaVue.length === 0}
                onClick={() =>
                  cocherMutation.mutate({ ids: aDecocherDansLaVue.map((demande) => demande._id), a_envoyer: false })
                }
              >
                Décocher toute la vue ({aDecocherDansLaVue.length})
              </Button>
            </div>
          )}
          <AdminTable
            data={tableData}
            columns={COLONNES}
            tableLabel={`Demandes d'activation : ${LIBELLES_VUES[vue]}`}
            pagination={{ total: demandesDeLaVue.length, page: currentPage, limit: pageSize, lastPage }}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSize={pageSize}
            sorting={tri}
            onSortingChange={(nouveauTri) => {
              setTri(nouveauTri);
              setPage(1);
            }}
            manualSorting
            emptyMessage="Aucune demande dans cette vue"
          />
        </>
      )}

      <CorrectionDemandeModal demande={enCorrection} corriger={corriger} />

      <envoiModal.Component
        title="Envoyer les e-mails"
        buttons={[
          { children: "Annuler", priority: "secondary", doClosesModal: true },
          {
            children: "Confirmer l'envoi",
            doClosesModal: false,
            disabled: envoiMutation.isPending || cocheEnCours || cochees.length === 0,
            nativeButtonProps: { type: "button" },
            onClick: envoyer,
          },
        ]}
      >
        <p>
          {cochees.length} demande(s) cochée(s) :{" "}
          {zBrancheDemandeActivation.options
            .map(
              (branche) =>
                `${cochees.filter((demande) => demande.branche === branche).length} ${LIBELLES_BRANCHES[branche].toLowerCase()}`
            )
            .join(", ")}
          . DECA est activé pour les établissements en activation ou compte existant, puis chaque e-mail part.
        </p>
        <ul>
          {cochees.map((demande) => (
            <li key={demande._id}>
              {nomCfa(demande)} : {demande.email} ({LIBELLES_BRANCHES[demande.branche].toLowerCase()}, {demande.source})
            </li>
          ))}
        </ul>
      </envoiModal.Component>
    </>
  );
}
