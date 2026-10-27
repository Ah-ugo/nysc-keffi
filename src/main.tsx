import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import { theme } from "./theme";
import { AuthProvider } from "./auth";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><ChakraProvider theme={theme}><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></ChakraProvider></React.StrictMode>
);
