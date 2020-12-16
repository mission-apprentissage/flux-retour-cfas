import { Field, Form, Formik } from "formik";
import queryString from "query-string";
import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Button, Card, Form as TablerForm, Grid, Page } from "tabler-react";
import * as Yup from "yup";

import CenteredCol from "../../common/components/CenteredCol";
import FormError from "../../common/components/FormError";
import useAuth from "../../common/hooks/useAuth";
import { _post } from "../../common/httpClient";

const ResetPasswordPage = () => {
  let [, setAuth] = useAuth();
  let history = useHistory();
  let location = useLocation();
  let { passwordToken } = queryString.parse(location.search);

  let showError = (meta) => {
    return meta.touched && meta.error
      ? {
          feedback: meta.error,
          invalid: true,
        }
      : {};
  };

  let changePassword = async (values, { setStatus }) => {
    try {
      let { token } = await _post("/api/password/reset-password", { ...values, passwordToken });
      setAuth(token);
      history.push("/");
    } catch (e) {
      console.error(e);
      setStatus({
        error: (
          <span>
            Le lien est expiré ou invalide, merci de prendre contact avec un administrateur en précisant votre adresse
            mail :
            <br />
            <a href="mailto:flux-retour-cfas@apprentissage.beta.gouv.fr">flux-retour-cfas@apprentissage.beta.gouv.fr</a>
          </span>
        ),
      });
    }
  };

  return (
    <Page>
      <Page.Main>
        <Page.Content>
          <Grid.Row>
            <CenteredCol>
              <div className="text-center mb-6">
                <img src="/brand/flux-cfas.png" className="h-6" alt="" />
              </div>
              <Card>
                <Card.Header>
                  <Card.Title>Changement du mot de passe</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Formik
                    initialValues={{
                      newPassword: "",
                    }}
                    validationSchema={Yup.object().shape({
                      newPassword: Yup.string()
                        .required("Veuillez saisir un mot de passe")
                        .matches(
                          "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$",
                          "Le mot de passe doit contenir au moins 8 caractères, une lettre en majuscule, un chiffre et un caractère spécial"
                        ),
                    })}
                    onSubmit={changePassword}
                  >
                    {({ status = {} }) => {
                      return (
                        <Form>
                          <TablerForm.Group label="Nouveau mot de passe">
                            <Field name="newPassword">
                              {({ field, meta }) => {
                                return (
                                  <TablerForm.Input
                                    type={"password"}
                                    placeholder="Votre mot de passe..."
                                    {...field}
                                    {...showError(meta)}
                                  />
                                );
                              }}
                            </Field>
                          </TablerForm.Group>
                          <Button color="primary" className="text-left" type={"submit"}>
                            Réinitialiser le mot de passe
                          </Button>
                          {status.error && <FormError>{status.error}</FormError>}
                        </Form>
                      );
                    }}
                  </Formik>
                </Card.Body>
              </Card>
            </CenteredCol>
          </Grid.Row>
        </Page.Content>
      </Page.Main>
    </Page>
  );
};

export default ResetPasswordPage;
