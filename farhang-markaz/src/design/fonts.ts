import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Vendored (OFL) so renders are deterministic and work offline.
export const serif = "Cormorant Garamond";
export const mono = "IBM Plex Mono";

loadFont({ family: serif, url: staticFile("fonts/CormorantGaramond-var.woff2"), weight: "300 700" });
loadFont({ family: mono, url: staticFile("fonts/IBMPlexMono-400.woff2"), weight: "400" });
