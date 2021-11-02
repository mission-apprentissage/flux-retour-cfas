import PropTypes from "prop-types";
import React from "react";

import BetaDisclaimer from "../BetaDisclaimer/BetaDisclaimer";
import AppHeader from "./AppHeader";
import NavBar from "./NavBar";

const Page = ({ children }) => {
  return (
    <>
      <AppHeader />
      <NavBar />
      {children}
      <BetaDisclaimer />
    </>
  );
};

Page.propTypes = {
  children: PropTypes.node.isRequired,
};
export default Page;
