
import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App.jsx";

const theme = createTheme({
  palette: {
    primary: {
      main: "rgb(49, 79, 57)",
    },
    background: {
      default: "#f7f7f5",
    },
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
  },
  shape: {
    borderRadius: 10,
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
