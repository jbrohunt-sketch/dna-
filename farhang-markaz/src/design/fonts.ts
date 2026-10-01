import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Vendored (OFL) so renders are deterministic and offline. Provisional pending the reference.
export const sans = "Inter Tight";

loadFont({ family: sans, url: staticFile("fonts/InterTight-var.woff2"), weight: "100 900" });
