"use client";

import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";

import { CGU_ARTICLES } from "./articles";

export function CguSideMenu({ className }: { className?: string }) {
  return (
    <SideMenu
      align="left"
      title="Sommaire"
      burgerMenuButtonText="Sommaire"
      sticky
      className={className}
      items={CGU_ARTICLES.map(({ id, number, name }) => ({
        text: (
          <>
            <strong>{number}.</strong> {name}
          </>
        ),
        linkProps: { href: `#${id}` },
      }))}
    />
  );
}
