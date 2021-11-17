import PropTypes from "prop-types";
import React from "react";

import ContactSection from "../ContactSection/ContactSection";
import AppHeader from "./AppHeader";
import NavBar from "./NavBar";

const Page = ({ children }) => {
  return (
    <>
      <AppHeader />
      <NavBar />
      {children}
      <ContactSection />
    </>
  );
};

Page.propTypes = {
  children: PropTypes.node.isRequired,
};
export default Page;
