import { createRoot } from "react-dom/client";
import App from "./skateboard-designer";

document.addEventListener("DOMContentLoaded", () => {
  const root = createRoot(document.getElementById("root") as HTMLElement);
  root.render(<App />);
});
