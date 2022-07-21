import React, { PropsWithChildren } from "react";
import { useColorMode } from "@docusaurus/theme-common";
import { createTheme, ThemeProvider } from "@mui/material/styles";

export const ThemedWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const { colorMode } = useColorMode();

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: { mode: colorMode, primary: { main: "#25c2a0" } },
      }),
    [colorMode]
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export function withThemed<T>(Component: React.ComponentType<T>): React.FC<T> {
  const Wrapped: React.FC<T> = (props) => {
    return (
      <ThemedWrapper>
        <Component {...props} />
      </ThemedWrapper>
    );
  };

  return Wrapped;
}
