import { Field, Form, Formik } from "formik";
import React from "react";
import { useHistory } from "react-router-dom";
import { Button, Card, Form as TablerForm, Grid, Page } from "tabler-react";
import * as Yup from "yup";

import CenteredCol from "../../common/components/CenteredCol";
import FormError from "../../common/components/FormError";
import FormMessage from "../../common/components/FormMessage";
import useAuth from "../../common/hooks/useAuth";
import { _post } from "../../common/httpClient";

const ForgottenPasswordPage = () => {
  let [, setAuth] = useAuth();
  let history = useHistory();

  let showError = (meta) => {
    return meta.touched && meta.error
      ? {
          feedback: meta.error,
          invalid: true,
        }
      : {};
  };

  let resetPassword = async (values, { setStatus }) => {
    try {
      let { token } = await _post("/api/password/forgotten-password", { ...values });
      setAuth(token);
      setStatus({ message: "Un email vous a été envoyé." });
      setTimeout(() => history.push("/"), 1500);
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
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
                  <Card.Title>Mot de passe oublié</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Formik
                    initialValues={{
                      username: "",
                    }}
                    validationSchema={Yup.object().shape({
                      username: Yup.string().required("Veuillez saisir un identifiant"),
                    })}
                    onSubmit={resetPassword}
                  >
                    {({ status = {} }) => {
                      return (
                        <Form>
                          <TablerForm.Group label="Identifiant">
                            <Field name="username">
                              {({ field, meta }) => {
                                return (
                                  <TablerForm.Input
                                    type={"text"}
                                    placeholder="Votre identifiant..."
                                    {...field}
                                    {...showError(meta)}
                                  />
                                );
                              }}
                            </Field>
                          </TablerForm.Group>
                          <Button color="primary" className="text-left" type={"submit"}>
                            Demander un nouveau mot de passe
                          </Button>
                          {status.error && <FormError>{status.error}</FormError>}
                          {status.message && <FormMessage>{status.message}</FormMessage>}
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

export default ForgottenPasswordPage;
