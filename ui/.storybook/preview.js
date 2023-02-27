import React from "react";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProvider } from "@chakra-ui/react";

import "../styles/MonthSelect.css";
import "remixicon/fonts/remixicon.css";
import "react-phone-input-2/lib/style.css";
import "react-datepicker/dist/react-datepicker.css";

import { AuthenticationContext } from "../components/UserWrapper/UserWrapper";
import theme from "../theme/index";
import Fonts from "../theme/Fonts";
import { organismeAtom } from "../hooks/organismeAtoms";
import { uploadsAtom } from "../modules/mon-espace/effectifs/engine/atoms";

const queryClient = new QueryClient();

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  options: {
    storySort: (a, b) => {
      return a[1].kind === b[1].kind ? 0 : a[1].id.localeCompare(b[1].id, undefined, { numeric: true });
    },
  },
  chakra: {
    theme,
  },
};

// https://github.com/RyanClementsHax/storybook-addon-next/issues/110
process.env.__NEXT_NEW_LINK_BEHAVIOR = "true";
export const decorators = [
  (Story, { parameters, args }) => {
    const mockedAuthArgs = Object.entries(args).reduce((acc, [key, value]) => {
      return key.startsWith("auth__") ? { ...acc, [key.replace("auth__", "")]: value } : acc;
    }, {});

    function initializeRecoilState({ set }) {
      set(organismeAtom, parameters.mockRecoil?.organisme);
      set(uploadsAtom, parameters.mockRecoil?.uploads);
    }

    return (
      <RecoilRoot initializeState={initializeRecoilState}>
        <ChakraProvider theme={theme} resetCSS>
          <QueryClientProvider client={queryClient}>
            <Fonts />
            <AuthenticationContext.Provider
              value={{
                auth: {
                  roles: [],
                  organisme_ids: [1],
                  permissions: [],
                  ...parameters?.mockAuth,
                  ...mockedAuthArgs,
                },
                token: {},
              }}
            >
              <Story />
            </AuthenticationContext.Provider>
          </QueryClientProvider>
        </ChakraProvider>
      </RecoilRoot>
    );
  },
];
