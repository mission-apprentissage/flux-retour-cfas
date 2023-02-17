import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { Redirect } from "react-router";

import useAuth from "../../../../common/hooks/useAuth";
import { _post } from "../../../../common/httpClient";
import { FiltersProvider, getDefaultState } from "../../../app/visualiser-les-indicateurs/FiltersContext";
import CfaPrivateView from "./CfaPrivateView";

const PAGE_STATES = {
  loading: "loading",
  error: "error",
  ready: "ready",
};

const CfaPrivateViewPage = ({ match }) => {
  const [auth, setAuth] = useAuth();
  const [pageState, setPageState] = useState(PAGE_STATES.loading);
  const cfaAccessToken = match.params.accessToken;

  useEffect(() => {
    const effect = async () => {
      try {
        setAuth(null);
        const { access_token } = await _post("/api/login-cfa", { cfaAccessToken });
        setAuth(access_token);
        setPageState(PAGE_STATES.ready);
      } catch (err) {
        setPageState(PAGE_STATES.error);
      }
    };
    effect();
    // eslint-disable-next-line
  }, [cfaAccessToken]);

  if (pageState === PAGE_STATES.error) return <Redirect to="/404" />;

  if (pageState === PAGE_STATES.ready) {
    const uai = auth?.sub;
    const defaultCfaState = { ...getDefaultState(), cfa: { uai_etablissement: uai } };
    return (
      <FiltersProvider defaultState={defaultCfaState}>
        <CfaPrivateView cfaUai={uai} />
      </FiltersProvider>
    );
  }

  return null;
};

CfaPrivateViewPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      accessToken: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default CfaPrivateViewPage;
