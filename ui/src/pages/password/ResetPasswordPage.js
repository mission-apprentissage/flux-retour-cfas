import React from "react";
import queryString from "query-string";
import * as Yup from "yup";
import { Form as TablerForm, Card, Page, Button, Grid } from "tabler-react";
import { Formik, Field, Form } from "formik";
import { useHistory, useLocation } from "react-router-dom";
import useAuth from "../../common/hooks/useAuth";
import { _post } from "../../common/httpClient";
import decodeJWT from "../../common/utils/decodeJWT";
import FormError from "../../common/components/FormError";
import CenteredCol from "../../common/components/CenteredCol";

export default () => {
  let [, setAuth] = useAuth();
  let history = useHistory();
  let location = useLocation();
  let { passwordToken } = queryString.parse(location.search);
  let uai = decodeJWT(passwordToken).sub;

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
            <a href="mailto:template-app@apprentissage.beta.gouv.fr">template-app@apprentissage.beta.gouv.fr</a>
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
              <Card>
                <Card.Header>
                  <Card.Title>Changement du mot de passe pour le CFA {uai}</Card.Title>
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
