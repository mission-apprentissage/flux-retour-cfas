import { useEffect } from "react";

import config from "../../../config";

const CrispScript = () => {
  useEffect(() => {
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = config.crispWebsiteId;

    (function () {
      var d = document;
      var s = d.createElement("script");

      s.src = "https://client.crisp.chat/l.js";
      s.async = 1;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();
  }, []);
};

export default CrispScript;
