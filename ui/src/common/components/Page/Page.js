import PropTypes from "prop-types";
import React from "react";

import { Footer } from "..";
import ContactSection from "../ContactSection/ContactSection";
import Header from "./Header";
import NavBar from "./NavBar";

const Page = ({ children }) => {
  return (
    <>
      <Header />
      <NavBar />
      {children}
      <ContactSection />
      <Footer />
    </>
  );
};

Page.propTypes = {
  children: PropTypes.node.isRequired,
};
export default Page;
