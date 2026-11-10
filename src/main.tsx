import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/figtree";
import "./styles.css";
import App from "./App";
import { StorefrontProvider } from "./services/StorefrontContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <StorefrontProvider>
          <App />
        </StorefrontProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
