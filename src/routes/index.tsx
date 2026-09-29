import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/connexion" });
  },
  head: () => ({
    meta: [
      { title: "Domaine Jalal AI — Accès à la plateforme" },
      {
        name: "description",
        content:
          "Accédez à la plateforme de gestion agricole et financière du Domaine Jalal : exploitations, dépenses, paiements et flux internes.",
      },
      { property: "og:title", content: "Domaine Jalal AI — Accès à la plateforme" },
      {
        property: "og:description",
        content: "Pilotez vos exploitations, vos dépenses et vos flux depuis un seul espace.",
      },
    ],
  }),
  component: () => null,
});
