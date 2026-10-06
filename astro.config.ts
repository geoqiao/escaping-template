import { defineConfig } from "astro/config";
import checkLinks from "./src/integrations/check-links.mjs";
import { base, origin } from "./src/lib/settings.ts";

// Every address ends in a slash and lives in its own directory.
export default defineConfig({
  site: origin,
  base: base || "/",
  trailingSlash: "always",
  build: { format: "directory" },
  compressHTML: false,
  devToolbar: { enabled: false },
  integrations: [checkLinks()],
});
