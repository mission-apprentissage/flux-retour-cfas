import React from "react";
import * as Yup from "yup";
import { Form as TablerForm, Card, Page, Alert, Header, Button, Grid } from "tabler-react";
import { Formik, Field, Form } from "formik";
import { NavLink, useHistory } from "react-router-dom";
import useAuth from "../../common/hooks/useAuth";
import { _post } from "../../common/httpClient";
import CenteredCol from "../../common/components/CenteredCol";
import FormError from "../../common/components/FormError";

export default () => {
  let [, setAuth] = useAuth();
  let history = useHistory();

  let feedback = (meta, message) => {
    return meta.touched && meta.error
      ? {
          feedback: message,
          invalid: true,
        }
      : {};
  };

  let login = async (values, { setStatus }) => {
    try {
      let { token } = await _post("/api/login", values);
      setAuth(token);
      history.push("/");
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
    }
  };

  return (
    <div className="page-single">
      <div className="container">
        <div className="row">
          <div className="col col-login mx-auto">
            <div className="text-center mb-6">
              <img src="/brand/flux-cfas.png" className="h-6" alt="" />
            </div>
            <form className="card" action="" method="post">
              <div className="card-body p-6">
                <div className="card-title">Login to your account</div>
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="exampleInputEmail1"
                    aria-describedby="emailHelp"
                    placeholder="Enter email"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Password
                    <a href="./forgot-password.html" className="float-right small">
                      I forgot password
                    </a>
                  </label>
                  <input type="password" className="form-control" id="exampleInputPassword1" placeholder="Password" />
                </div>
                <div className="form-group">
                  <label className="custom-control custom-checkbox">
                    <input type="checkbox" className="custom-control-input" />
                    <span className="custom-control-label">Remember me</span>
                  </label>
                </div>
                <div className="form-footer">
                  <button type="submit" className="btn btn-primary btn-block">
                    Sign in
                  </button>
                </div>
              </div>
            </form>
            <div className="text-center text-muted">
              Don't have account yet? <a href="./register.html">Sign up</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
