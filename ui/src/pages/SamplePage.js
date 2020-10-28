import React from "react";
import { Page, Site, Nav, AccountDropdown } from "tabler-react";

export default () => {
  return (
    <Site>
      <Site.Header>
        Flux Retour Cfas
        <div className="d-flex order-lg-2 ml-auto">
          <AccountDropdown
            avatarURL="https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&accessoriesType=Blank&hairColor=BrownDark&facialHairType=Blank&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light"
            name="XXX XXXX"
            description="Administrateur"
            options={[
              { icon: "user", value: "Profil", to: "/profil" },
              { icon: "settings", value: "Paramètres", to: "/settings" },
              "divider",
              { icon: "log-out", value: "Déconnexion", to: "/logout" },
            ]}
          />
        </div>
      </Site.Header>
      <Site.Nav>
        <div class="row row align-items-center">
          <div class="col-lg-3 ml-auto"></div>
          <div class="col col-lg order-lg-first">
            <ul class="nav nav-tabs border-0 flex-column flex-lg-row">
              <li class="nav-item">
                <a
                  aria-current="page"
                  class="nav-link active active"
                  history="[object Object]"
                  match="[object Object]"
                  href="/"
                >
                  <i class="fe fe-home"></i> Home
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link">
                  <i class="fe fe-box"></i> Interface
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link">
                  <i class="fe fe-calendar"></i> Components
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link">
                  <i class="fe fe-file"></i> Pages
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" history="[object Object]" match="[object Object]" href="/form-elements">
                  <i class="fe fe-check-square"></i> Forms
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" history="[object Object]" match="[object Object]" href="/gallery">
                  <i class="fe fe-image"></i> Gallery
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="https://tabler.github.io/tabler-react/documentation">
                  <i class="fe fe-file-text"></i> Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Site.Nav>
      <Page>
        <Page.Main>
          <Page.Content title="Tableau de bord - Sample"></Page.Content>
        </Page.Main>
      </Page>
    </Site>
  );
};
