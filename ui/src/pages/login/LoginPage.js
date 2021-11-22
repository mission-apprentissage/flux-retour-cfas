import { Box } from "@chakra-ui/react";
import PropTypes from "prop-types";
import queryString from "query-string";
import React from "react";

import { AppHeader } from "../../common/components";
import useAuth from "../../common/hooks/useAuth";
import { _post } from "../../common/httpClient";
import LoginBlock from "./LoginBlock";

const LoginPage = ({ history }) => {
  const [, setAuth] = useAuth();
  const pathToRedirectTo = queryString.parse(history.location.search)?.redirect || "/";

  const login = async (values, { setStatus }) => {
    try {
      const { access_token } = await _post("/api/login", values);
      setAuth(access_token);
      history.push(pathToRedirectTo);
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
    }
  };

  return (
    <>
      <AppHeader />
      <Box paddingY="6w" paddingLeft="120px" boxShadow="inset 0px 12px 12px 0px rgba(30, 30, 30, 0.08)">
        <LoginBlock onSubmit={login} />
      </Box>
    </>
  );
};

LoginPage.propTypes = {
  history: PropTypes.shape({
    location: PropTypes.shape({
      search: PropTypes.string,
    }).isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
};

export default LoginPage;
