"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Card from "@codegouvfr/react-dsfr/Card";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { Select } from "@codegouvfr/react-dsfr/Select";
import Table from "@codegouvfr/react-dsfr/Table";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { IErp } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { CONTACT_ADDRESS } from "@/common/constants/product";
import { _delete, _post, _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatDateDayMonthYear, formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import { useOrganisationOrganisme } from "@/hooks/organismes";
import { useErp } from "@/hooks/useErp";
import useToaster from "@/hooks/useToaster";

const desiredOrder = [
  "ymag",
  "gesti",
  "scform",
  "fcamanager",
  "aimaira",
  "cactus",
  "myclic",
  "gescicca",
  "formasup",
  "formasup-hdf",
  "charlemagne",
  "ammon",
  "ofa-link",
  "filiz",
  "hyperplanning",
];

/**
 * Composant à plusieurs états selon stepConfigurationERP.
 */
export default function ParametresClient() {
  const router = useRouter();
  const { toastSuccess } = useToaster();
  const [stepConfigurationERP, setStepConfigurationERP] = useState<"none" | "choix_erp" | "unsupported_erp" | "v3">(
    "none"
  );
  const [selectedERPId, setSelectedERPId] = useState("");
  const [selectedERP, setSelectedERP] = useState({} as IErp);
  const [unsupportedERPName, setUnsupportedERPName] = useState("");

  const { erps, erpsById } = useErp();

  const { organisme, refetch: refetchOrganisme } = useOrganisationOrganisme();

  const erpV3 = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("erpV3") : null;

  useEffect(() => {
    setSelectedERP(erpsById[selectedERPId]);
  }, [selectedERPId]);

  // redirige vers la finalisation API v3 si le paramètre est présent (= on vient de connexion-api)
  useEffect(() => {
    if (!erpV3) {
      return;
    }
    setSelectedERPId(erpV3);
    setStepConfigurationERP("v3");
    router.replace("/cfa/parametres"); // supprime le paramètre en query
  }, [erpV3]);

  if (!organisme) {
    return null;
  }

  const title = "Paramétrage de votre moyen de transmission";
  return (
    <div className="fr-container">
      <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
        <h1 className="fr-h3 fr-mb-3w fr-mt-3w" style={{ color: "var(--background-flat-blue-cumulus)" }}>
          {title}
        </h1>

        {stepConfigurationERP === "none" &&
          (organisme.mode_de_transmission ? (
            <>
              <div className="fr-grid-row fr-grid-row--gutters fr-mb-3w fr-mt-3w fr-p-3w fr-background-alt--grey">
                <div className="fr-col-12 fr-col-md-8">
                  {organisme.mode_de_transmission === "API" ? (
                    <>
                      <h2 className="fr-h4">
                        Votre moyen de transmission est paramétré avec{" "}
                        {organisme.erps?.map((erpId) => erpsById[erpId]?.name).join(", ")}.
                      </h2>
                      {organisme.mode_de_transmission_configuration_date && (
                        <p>
                          (configuré le{" "}
                          {formatDateNumericDayMonthYear(organisme.mode_de_transmission_configuration_date)} par{" "}
                          {organisme.mode_de_transmission_configuration_author_fullname})
                        </p>
                      )}
                      <DsfrLink href="/cfa" className="fr-mt-2w">
                        Mes effectifs
                      </DsfrLink>
                    </>
                  ) : organisme.erp_unsupported ? (
                    <>
                      <h2 className="fr-h4">Votre moyen de transmission est {organisme.erp_unsupported}.</h2>
                      {organisme.mode_de_transmission_configuration_date && (
                        <p>
                          (configuré le{" "}
                          {formatDateNumericDayMonthYear(organisme.mode_de_transmission_configuration_date)} par{" "}
                          {organisme.mode_de_transmission_configuration_author_fullname})
                        </p>
                      )}
                      <p className="fr-mt-2w">
                        Actuellement, cet ERP n&apos;est pas encore interfaçé avec le tableau de bord. Nous vous
                        tiendrons informé dès que ce sera le cas.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="fr-h4">Votre établissement n&apos;utilise pas d&apos;ERP.</h2>
                      {organisme.mode_de_transmission_configuration_date && (
                        <p>
                          (configuré le{" "}
                          {formatDateNumericDayMonthYear(organisme.mode_de_transmission_configuration_date)} par{" "}
                          {organisme.mode_de_transmission_configuration_author_fullname})
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="fr-col-12 fr-col-md-4">
                  <img src="/images/parametres-choix-transmission.svg" alt="" className="fr-responsive-img" />
                </div>
              </div>

              <Button
                onClick={async () => {
                  await _delete(`/api/v1/organismes/${organisme._id}/configure-erp`);
                  await refetchOrganisme();
                }}
                className="fr-mt-3w"
              >
                Réinitialiser ma configuration
              </Button>
            </>
          ) : (
            <>
              <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
                <div className="fr-col-12 fr-col-md-6">
                  <Card
                    border
                    title="Vous avez un ERP ?"
                    desc="Liez votre ou vos ERP au tableau de bord"
                    footer={
                      <Button
                        onClick={() => {
                          setStepConfigurationERP("choix_erp");
                        }}
                      >
                        Choisir cette méthode
                      </Button>
                    }
                  />
                </div>

                <div className="fr-col-12 fr-col-md-6">
                  <Card
                    border
                    title="Vous n'avez pas d'ERP ?"
                    desc="Importez vos effectifs avec un fichier Excel"
                    footer={
                      <Button
                        onClick={async () => {
                          await _put(`/api/v1/organismes/${organisme._id}/configure-erp`, {
                            mode_de_transmission: "MANUEL",
                          });
                          await refetchOrganisme();
                        }}
                      >
                        Choisir cette méthode
                      </Button>
                    }
                  />
                </div>
              </div>

              <Alert
                severity="info"
                title=""
                description="Un outil de gestion / ERP (Enterprise Ressource Planning ou PGI pour Progiciel de Gestion Intégré) est une solution logicielle permettant d'unifier le système d'information d'une entreprise autour d'une base de données unique."
                className="fr-mt-3w"
              />
            </>
          ))}

        {stepConfigurationERP === "choix_erp" && (
          <div className="fr-mt-3w">
            <div className="fr-mb-3w">
              <Select
                label="Sélectionnez votre ERP ou outil de gestion utilisé"
                nativeSelectProps={{
                  onChange: (e) => setSelectedERPId(e.target.value),
                  required: true,
                }}
              >
                <option value="" disabled selected>
                  ERP...
                </option>
                {erps
                  .filter(({ disabled }) => !disabled)
                  .sort((a, b) => {
                    const indexA = desiredOrder.indexOf(a.unique_id);
                    const indexB = desiredOrder.indexOf(b.unique_id);
                    return indexA - indexB;
                  })
                  .map((erp) => (
                    <option value={erp.unique_id} key={erp.unique_id}>
                      {erp.name}
                    </option>
                  ))}

                <option value="other" key="other">
                  J&apos;utilise un autre ERP
                </option>
              </Select>
            </div>

            <div className="fr-btns-group fr-btns-group--inline-md">
              <Button
                priority="secondary"
                onClick={() => {
                  setStepConfigurationERP("none");
                  setSelectedERPId("");
                }}
              >
                Revenir en arrière
              </Button>

              <Button
                disabled={!selectedERPId}
                onClick={() => {
                  setStepConfigurationERP(selectedERP.apiV3 ? "v3" : "unsupported_erp");
                }}
              >
                Confirmer
              </Button>
            </div>
          </div>
        )}

        {stepConfigurationERP === "unsupported_erp" && (
          <div className="fr-mt-3w">
            <Alert severity="success" title="Votre établissement utilise un autre ERP." className="fr-mb-3w" />

            <div className="fr-mb-3w">
              <label className="fr-label" htmlFor="erp_name">
                Veuillez indiquer le nom de votre ERP :<span className="fr-hint-text">Champ obligatoire</span>
              </label>
              <input
                className="fr-input"
                type="text"
                id="erp_name"
                name="erp_name"
                placeholder="Nom de l'ERP..."
                required
                onChange={(e) => setUnsupportedERPName(e.target.value)}
              />
            </div>

            <div className="fr-btns-group fr-btns-group--inline-md">
              <Button
                priority="secondary"
                onClick={() => {
                  setStepConfigurationERP("choix_erp");
                  setSelectedERPId("");
                }}
              >
                Revenir en arrière
              </Button>

              <Button
                disabled={unsupportedERPName.length === 0}
                onClick={async () => {
                  await _put(`/api/v1/organismes/${organisme._id}/configure-erp`, {
                    mode_de_transmission: "MANUEL",
                    erp_unsupported: unsupportedERPName,
                  });
                  await refetchOrganisme();
                  setStepConfigurationERP("none");
                  setSelectedERPId("");
                  setUnsupportedERPName("");
                }}
              >
                Valider
              </Button>
            </div>
          </div>
        )}

        {stepConfigurationERP === "v3" && (
          <ConfigurationERPV3
            erpsById={erpsById}
            organisme={organisme}
            erpId={selectedERPId}
            onGenerateKey={async () => {
              await _post(`/api/v1/organismes/${organisme._id}/api-key`);
              toastSuccess("Votre clé d'échange a été correctement générée.");
              await refetchOrganisme();
            }}
            onConfigurationMismatch={async () => {
              setStepConfigurationERP("none");
              setSelectedERPId("");
            }}
            onBack={() => {
              setStepConfigurationERP("choix_erp");
              setSelectedERPId("");
            }}
            onSubmit={async () => {
              await _put(`/api/v1/organismes/${organisme._id}/configure-erp`, {
                mode_de_transmission: "API",
                erps: [selectedERPId],
              });
              await refetchOrganisme();
              setStepConfigurationERP("none");
              setSelectedERPId("");
            }}
          />
        )}
      </SuspenseWrapper>
    </div>
  );
}

interface ConfigurationERPV3Props {
  erpId: string;
  organisme: Organisme;
  onGenerateKey: () => any;
  onConfigurationMismatch: () => any;
  onBack: () => any;
  onSubmit: () => any;
  erpsById: any;
}
function ConfigurationERPV3(props: ConfigurationERPV3Props) {
  const { toastSuccess } = useToaster();
  const [copied, setCopied] = useState(false);

  const erp = props.erpsById[props.erpId];
  const verified = !!props.organisme.api_siret && !!props.organisme.api_uai;

  if (!erp) {
    return (
      <Alert
        severity="warning"
        title={`L'ERP ${props.erpId} n'est pas pris en charge.`}
        description={
          <>
            Veuillez{" "}
            <a
              href={`mailto:${CONTACT_ADDRESS}?subject=ERP non pris en charge "${props.erpId}" détecté lors du paramétrage`}
            >
              contacter le support
            </a>
            .
          </>
        }
      />
    );
  }

  return (
    <div className="fr-mt-3w">
      <Alert severity="success" title={`Votre établissement utilise ${erp.name}.`} className="fr-mb-3w" />

      {verified ? (
        <>
          <h2 className="fr-h4 fr-mb-3w">Finalisez l&apos;opération de paramétrage pour transmettre vos effectifs.</h2>
          <div className="fr-mb-3w">
            <Checkbox
              options={[
                {
                  label: "Vous avez correctement installé la nouvelle clé d'échange sur votre ERP",
                  nativeInputProps: {
                    defaultChecked: true,
                    disabled: true,
                  },
                },
              ]}
            />
          </div>
          <div className="fr-mb-3w">
            <p className="fr-mb-2w">
              Confirmez que l&apos;UAI et le SIRET indiqués ci-dessous correspondent à votre établissement :
            </p>
            <Table
              caption=""
              headers={["Organisme de formation", "SIRET", "UAI", "Interfaçage"]}
              data={[
                [
                  props.organisme.enseigne ?? props.organisme.raison_sociale ?? "Organisme inconnu",
                  props.organisme.api_siret,
                  props.organisme.api_uai,
                  props.organisme.api_configuration_date
                    ? formatDateDayMonthYear(props.organisme.api_configuration_date)
                    : "Non configuré",
                ],
              ]}
            />
          </div>
          <div className="fr-btns-group fr-btns-group--inline-md fr-btns-group--right">
            <Button priority="secondary" onClick={props.onConfigurationMismatch}>
              <a
                href={`mailto:${CONTACT_ADDRESS}?subject=Mauvaise configuration paramétrage ERP - API`}
                className="fr-link"
              >
                Je ne confirme pas
              </a>
            </Button>
            <Button onClick={props.onSubmit}>Je confirme</Button>
          </div>
        </>
      ) : (
        <>
          <h2 className="fr-h4 fr-mb-3w">Démarrer l&apos;interfaçage avec {erp.name}.</h2>

          <Alert
            severity="warning"
            title="Comment générer votre clé d'échange"
            description={
              <ol className="fr-mt-2w">
                <StepItem active={!props.organisme.api_key}>
                  Générer la clé en cliquant sur le bouton ci-dessous
                </StepItem>
                <StepItem active={!!props.organisme.api_key && !copied && !verified}>Copier la clé</StepItem>
                <StepItem active={!!props.organisme.api_key && copied && !verified}>
                  Retourner dans votre compte ERP pour la coller
                </StepItem>
                <StepItem active={!!props.organisme.api_key && copied && !verified}>
                  Finaliser en confirmant l&apos;UAI et SIRET de votre établissement
                </StepItem>
              </ol>
            }
            className="fr-mb-3w"
          />

          {props.organisme.api_key ? (
            <>
              <div className="fr-mb-3w">
                <label className="fr-label" htmlFor="apiKey">
                  Votre clé d&apos;échange
                </label>
                <input
                  className="fr-input"
                  type="text"
                  id="apiKey"
                  name="apiKey"
                  value={props.organisme.api_key}
                  readOnly
                />
              </div>

              <div className="fr-btns-group fr-btns-group--inline-md">
                <Button priority="secondary" onClick={props.onBack}>
                  Revenir en arrière
                </Button>

                <CopyToClipboard
                  text={props.organisme.api_key}
                  onCopy={() => {
                    setCopied(true);
                    toastSuccess("Copié !");
                  }}
                >
                  <Button>Copier la clé</Button>
                </CopyToClipboard>
              </div>
            </>
          ) : (
            <div className="fr-btns-group fr-btns-group--inline-md">
              <Button priority="secondary" onClick={props.onBack}>
                Revenir en arrière
              </Button>

              <Button onClick={props.onGenerateKey}>Générer la clé d&apos;échange</Button>
            </div>
          )}

          {erp.helpFilePath && (
            <Card
              border
              title={`Tutoriel pour ${erp.name}`}
              desc="Une fois votre clé générée et copiée, veuillez la coller dans votre compte ERP. Ci-dessous, voyez comment procéder."
              footer={
                <DsfrLink href={erp.helpFilePath} external>
                  Lire le tutoriel
                </DsfrLink>
              }
              className="fr-mt-3w"
              size="small"
            />
          )}
        </>
      )}
    </div>
  );
}

interface StepItemProps {
  children: ReactNode;
  active?: boolean;
}

function StepItem({ children, active = false }: StepItemProps) {
  if (active) {
    return (
      <li className="fr-text--bold" style={{ color: "var(--text-label-blue-france)" }}>
        {children}
      </li>
    );
  }
  return <li className="fr-pl-3w">{children}</li>;
}
