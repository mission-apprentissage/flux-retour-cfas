import { captureException, withScope } from "@sentry/nextjs";

/**
 * Sans ce hook, aucune erreur levée pendant le rendu serveur de l'App Router ne
 * remonte : les configs Sentry n'instrumentent que ce qui passe par le client.
 *
 * `Sentry.captureRequestError` n'existe qu'à partir du SDK v8 — on écrit donc le
 * hook à la main, ce qui referme le trou sans attendre la migration. À la
 * migration, ce fichier deviendra le point de chargement des configs et le corps
 * se réduira à `Sentry.captureRequestError`.
 *
 * On n'exporte volontairement pas `register()` : le plugin webpack v7 injecte
 * lui-même sentry.server.config.ts et sentry.edge.config.ts, et on ne veut pas
 * prendre la main sur ce chargement.
 */
type RequestInfo = { path?: string; method?: string };
type ErrorContext = { routerKind?: string; routePath?: string; routeType?: string; renderSource?: string };

export function onRequestError(error: unknown, request: RequestInfo, context: ErrorContext): void {
  withScope((scope) => {
    scope.setTag("alert_tier", "jour");
    scope.setTag("error_kind", "bug");
    scope.setTag("http.method", request.method ?? "unknown");
    // routePath reste en contexte : le tag route_group porte une taxonomie métier
    // côté serveur, et y mêler des chemins Next rendrait le filtrage ambigu.
    scope.setContext("requête", {
      path: request.path,
      routePath: context.routePath,
      routerKind: context.routerKind,
      routeType: context.routeType,
      renderSource: context.renderSource,
    });
    captureException(error);
  });
}
