import React from "react";
import { Site } from "tabler-react";

import Header from "./components/Header";
import NavigationMenu from "./components/NavigationMenu";
import Footer from "./components/Footer";

const Layout = (props) => {
  return (
    <Site className="flex-fill">
      <Header />
      <NavigationMenu />
      {props.children}
      <Footer />
    </Site>
  );
};

export default Layout;
