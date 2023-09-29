import React from "react";
import type { Preview } from "@storybook/react";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProvider } from "@chakra-ui/react";
import _JSXStyle from "styled-jsx/style";

import "../styles/MonthSelect.css";
import "remixicon/fonts/remixicon.css";
import "react-phone-input-2/lib/style.css";
import "react-datepicker/dist/react-datepicker.css";

import { AuthenticationContext } from "../components/UserWrapper/UserWrapper";
import { AuthContext } from "../common/internal/AuthContext";
import theme from "../theme/index";
import Fonts from "../theme/Fonts";
import { organismeAtom } from "../hooks/organismeAtoms";

const queryClient = new QueryClient();

// https://triplecore.io/blog/next-typescript-storybook/
if (typeof global !== "undefined") {
  Object.assign(global, { _JSXStyle });
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    options: {
      storySort: (a, b) => (a.id === b.id ? 0 : a.id.localeCompare(b.id, undefined, { numeric: true })),
    },
    chakra: {
      theme,
    },
  },
  decorators: [
    (Story, { parameters, args }) => {
      const mockedAuthArgs: Partial<AuthContext> = Object.entries(args).reduce((acc, [key, value]) => {
        return key.startsWith("auth__") ? { ...acc, [key.replace("auth__", "")]: value } : acc;
      }, {});

      function initializeRecoilState({ set }) {
        set(organismeAtom, parameters.mockRecoil?.organisme);
      }

      return (
        <RecoilRoot initializeState={initializeRecoilState}>
          <ChakraProvider theme={theme} resetCSS>
            <QueryClientProvider client={queryClient}>
              <Fonts />
              <AuthenticationContext.Provider
                value={{
                  auth: {
                    ...parameters?.mockAuth,
                    ...mockedAuthArgs,
                  },
                }}
              >
                <Story />
              </AuthenticationContext.Provider>
            </QueryClientProvider>
          </ChakraProvider>
        </RecoilRoot>
      );
    },
  ],
};

export default preview;
