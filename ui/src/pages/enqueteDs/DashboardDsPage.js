import React from "react";
import { Page, Site, Nav, Grid, Header, Alert, StampCard } from "tabler-react";
import { useFetch } from "../../common/hooks/useFetch";
import Layout from "../layout/Layout";
import { sortBy } from "lodash";

export default () => {
  const [data, loading] = useFetch("api/statsDs");

  return (
    <Layout>
      <Page>
        <Page.Main>
          <Page.Content title="Tableau de bord - Enquete Ds">
            {loading && "Chargement des données..."}
            {data && (
              <>
                {/* Stats Globales */}
                <Header.H5>Statistiques Globales</Header.H5>
                <Grid.Row cards={true}>
                  <Grid.Col sm={6} lg={4}>
                    <div className="card">
                      <div className="card-body p-3 text-center">
                        <div className="display-4 font-weight-bold mb-4">{data.statsDs.globalStats.nbReponsesDs}</div>
                        <div className="mb-4">Réponses DS</div>
                      </div>
                    </div>
                  </Grid.Col>
                  <Grid.Col sm={6} lg={4}>
                    <div className="card">
                      <div className="card-body p-3 text-center">
                        <div className="display-4 font-weight-bold mb-4">
                          {data.statsDs.globalStats.nbReponsesSiretUniquesInDs}
                        </div>
                        <div className="mb-4">Réponses DS avec siret uniques</div>
                      </div>
                    </div>
                  </Grid.Col>
                  <Grid.Col sm={6} lg={4}>
                    <div className="card">
                      <div className="card-body p-3 text-center">
                        <div className="display-4 font-weight-bold mb-4">
                          {data.statsDs.globalStats.nbDossiersAvecFichierAttache}
                        </div>
                        <div className="mb-4">Dossiers DS avec fichier attaché</div>
                      </div>
                    </div>
                  </Grid.Col>
                </Grid.Row>

                {/* Stats Taux Réponses Catalogue */}
                <Header.H5>Taux Répondants Catalogue</Header.H5>
                <Grid.Row>
                  <Grid.Col sm={6} lg={6}>
                    <div className="card">
                      <div className="card-body text-center">
                        <div className="h5">Réponses OK siret unique / catalogue</div>
                        <div className="display-4 font-weight-bold mb-4">
                          {data.statsDs.globalStats.RepondantsOk.tauxReponseSiretUniquesTotalCatalogue} %
                        </div>
                        <div className="progress progress-sm">
                          <div
                            className="progress-bar bg-green"
                            style={{
                              width: `${data.statsDs.globalStats.RepondantsOk.tauxReponseSiretUniquesTotalCatalogue}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Grid.Col>
                  <Grid.Col sm={6} lg={6}>
                    <div className="card">
                      <div className="card-body text-center">
                        <div className="h5">Réponses KO siret unique / catalogue</div>
                        <div className="display-4 font-weight-bold mb-4">
                          {data.statsDs.globalStats.RepondantsKo.tauxNonRepondantsTotalCatalogue} %
                        </div>
                        <div className="progress progress-sm">
                          <div
                            className="progress-bar bg-red"
                            style={{
                              width: `${data.statsDs.globalStats.RepondantsKo.tauxNonRepondantsTotalCatalogue}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Grid.Col>
                </Grid.Row>

                {/* Stats Sib */}
                <Header.H5>Statistiques Sendinblue</Header.H5>
                <Grid.Row cards={true}>{data.statsDs.sendinblueStats.map((item) => getSibStatTable(item))}</Grid.Row>

                {/* Stats Erp */}
                <Header.H5>Statistiques par ERPs</Header.H5>
                <Grid.Row cards={true}>
                  <Grid.Col sm={12} lg={12}>
                    <div className="row row-cards row-deck">
                      <div className="col-12">
                        <div className="card">
                          <div className="table-responsive">
                            <table className="table table-hover table-outline table-vcenter text-nowrap card-table">
                              <thead>
                                <tr>
                                  <th>ERP</th>
                                  <th>Réponses</th>
                                  <th>Réponses Siret Unique</th>
                                  <th>Réponses/catalogue</th>
                                  <th>Réponses/total DS</th>
                                  <th>Volumétrie/catalogue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortBy(data.statsDs.reponses_par_erp, "tauxReponseTotalCatalogue")
                                  .reverse()
                                  .map((item) => getErpTableRow(item))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Grid.Col>
                </Grid.Row>

                {/* Stats Academies */}
                <Header.H5>Statistiques par Academies</Header.H5>
                <Grid.Row cards={true}>
                  <Grid.Col sm={12} lg={12}>
                    <div className="row row-cards row-deck">
                      <div className="col-12">
                        <div className="card">
                          <div className="table-responsive">
                            <table className="table table-hover table-outline table-vcenter text-nowrap card-table">
                              <thead>
                                <tr>
                                  <th>Region</th>
                                  <th>Academie</th>
                                  <th>Réponses</th>
                                  <th>Réponses Siret Unique</th>
                                  <th>Réponses/catalogue</th>
                                  <th>Réponses/total DS</th>
                                  <th>Volumétrie/catalogue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortBy(data.statsDs.reponses_par_regions_academies, "region").map((item) =>
                                  getAcademieTableRow(item)
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Grid.Col>
                </Grid.Row>
              </>
            )}
          </Page.Content>
        </Page.Main>
      </Page>
    </Layout>
  );
};

/** Tableau de stats de campagne SIB */
const getSibStatTable = (sibData) => {
  return (
    <Grid.Col key={sibData.campagne_id} sm={6} lg={4}>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{sibData.campagne_nom}</h3>
        </div>
        <div className="table-responsive">
          <table className="table card-table table-striped table-vcenter">
            <thead>
              <tr>
                <th>Mails envoyés</th>
                <th>Mails ouverts</th>
                <th>Cliqués</th>
                <th>Erreurs mail</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{sibData.nbMailsEnvoyes}</td>
                <td>{sibData.nbMailsOuverts}</td>
                <td>{sibData.nbMailsCliquesVersDs}</td>
                <td>{sibData.nbAdressesErronnees}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Grid.Col>
  );
};

/** Tableau de stats d'ERP */
const getErpTableRow = (erpData) => {
  return (
    <tr key={erpData.erp}>
      <td>
        <div>{erpData.erp}</div>
      </td>
      <td>
        <div>{erpData.nbStatuts}</div>
      </td>
      <td>
        <div>{erpData.RepondantsOk.nbReponsesDsSiretUnique}</div>
      </td>
      <td>
        <div className="clearfix">
          <div className="float-left">
            <strong>{erpData.RepondantsOk.tauxReponseSiretUniquesTotalCatalogue} %</strong>
          </div>
        </div>
        <div className="progress progress-xs">
          <div
            className="progress-bar bg-green"
            role="progressbar"
            style={{ width: `${erpData.RepondantsOk.tauxReponseSiretUniquesTotalCatalogue}%` }}
            aria-valuenow={erpData.RepondantsOk.tauxReponseSiretUniquesTotalCatalogue}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </td>
      <td>
        <div className="clearfix">
          <div className="float-left">
            <strong>{erpData.tauxReponseTotalDossiersDs} %</strong>
          </div>
        </div>
        <div className="progress progress-xs">
          <div
            className="progress-bar bg-yellow"
            role="progressbar"
            style={{ width: `${erpData.tauxReponseTotalDossiersDs}%` }}
            aria-valuenow={erpData.tauxReponseTotalDossiersDs}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </td>
      <td>
        <div className="clearfix">
          <div className="float-left">
            <strong>{get2decimals(erpData.sommeVolumetrieEstimeeReponsesFormationsCatalogue)} %</strong>
          </div>
        </div>
        <div className="progress progress-xs">
          <div
            className="progress-bar bg-blue"
            role="progressbar"
            style={{ width: `${erpData.sommeVolumetrieEstimeeReponsesFormationsCatalogue}%` }}
            aria-valuenow={erpData.sommeVolumetrieEstimeeReponsesFormationsCatalogue}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </td>
    </tr>
  );
};

/** Tableau de stats d'Académie */
const getAcademieTableRow = (academieData) => {
  return (
    <tr key={academieData.region + academieData.academie}>
      <td>
        <div>{academieData.region}</div>
      </td>
      <td>
        <div>{academieData.academie}</div>
      </td>
      <td>
        <div>{academieData.nbStatuts}</div>
      </td>
      <td>
        <div>{academieData.RepondantsOk.nbReponsesDsSiretUnique}</div>
      </td>
      <td>
        <div className="clearfix">
          <div className="float-left">
            <strong>{academieData.RepondantsOk.tauxReponseSiretUniquesTotalCatalogue} %</strong>
          </div>
        </div>
        <div className="progress progress-xs">
          <div
            className="progress-bar bg-green"
            role="progressbar"
            style={{ width: `${academieData.RepondantsOk.tauxReponseSiretUniquesTotalCatalogue}%` }}
            aria-valuenow={academieData.RepondantsOk.tauxReponseSiretUniquesTotalCatalogue}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </td>
      <td>
        <div className="clearfix">
          <div className="float-left">
            <strong>{academieData.tauxReponseTotalDossiersDs} %</strong>
          </div>
        </div>
        <div className="progress progress-xs">
          <div
            className="progress-bar bg-yellow"
            role="progressbar"
            style={{ width: `${academieData.tauxReponseTotalDossiersDs}%` }}
            aria-valuenow={academieData.tauxReponseTotalDossiersDs}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </td>
      <td>
        <div className="clearfix">
          <div className="float-left">
            <strong>{get2decimals(academieData.sommeVolumetrieEstimeeReponsesFormationsCatalogue)} %</strong>
          </div>
        </div>
        <div className="progress progress-xs">
          <div
            className="progress-bar bg-blue"
            role="progressbar"
            style={{ width: `${academieData.sommeVolumetrieEstimeeReponsesFormationsCatalogue}%` }}
            aria-valuenow={academieData.sommeVolumetrieEstimeeReponsesFormationsCatalogue}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </td>
    </tr>
  );
};

const get2decimals = (textValue) => parseFloat(textValue).toFixed(2);
