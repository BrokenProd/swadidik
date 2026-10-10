import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./App.css";
import App from "./App";
import { ThemeProvider } from "./shared/theme";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ThemeProvider>,
);
