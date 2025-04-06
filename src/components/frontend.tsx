import { createRoot } from "react-dom/client";
import App from "./konva/skateboard";

document.addEventListener("DOMContentLoaded", () => {
  const root = createRoot(document.getElementById("root") as HTMLElement);
  root.render(<App />);
});
