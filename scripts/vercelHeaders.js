// Emits public/vercel.json so a static-export deploy on Vercel serves the same
// security headers as the dev server. Next copies public/* into out/, and
// `vercel out --prod` reads out/vercel.json. Run as part of build:prebuild.

const { writeFileSync } = require("fs");
const { join } = require("path");
const { securityHeaders } = require("../securityHeaders");

const config = {
  headers: [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
};

const contents = `${JSON.stringify(config, null, 2)}\n`;

// public/vercel.json  -> copied to out/vercel.json for `vercel out --prod`.
// vercel.json (root)  -> read by Vercel when it builds from Git instead.
const targets = [
  join(__dirname, "..", "public", "vercel.json"),
  join(__dirname, "..", "vercel.json"),
];

targets.forEach((target) => {
  writeFileSync(target, contents);
  // eslint-disable-next-line no-console
  console.log(`Wrote ${target}`);
});
