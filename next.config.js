// @ts-check

const isProduction = process.env.NODE_ENV === "production";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const bundleAnalyzer = process.env.npm_config_argv?.includes(
  "build:bundle-analyzer"
);

const path = require("path");
const webpack = require("webpack");

// Content-Security-Policy. This app is a static export that runs emulators and
// language runtimes (QuickJS, Pyodide, v86, BoxedWine) needing eval/WASM, embeds
// Next's inline bootstrap, and injects styled-components inline styles — so
// script/style/connect/frame sources must stay permissive or the app won't boot.
// The value here comes from locking down the directives that CAN be restricted
// without breaking functionality (no plugins, no base-tag hijack, no framing by
// third parties); XSS is defended primarily by output escaping (see ResultEntry
// and AIChat), with this CSP as defense-in-depth.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: data:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: data: https:",
  "connect-src 'self' https: wss: data: blob:",
  "worker-src 'self' blob:",
  "child-src 'self' blob: https:",
  "frame-src 'self' https: blob: data:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self' https:",
].join("; ");

/**
 * @type {import("next").NextConfig}
 * */
const nextConfig = {
  assetPrefix: basePath,
  basePath,
  compiler: {
    reactRemoveProperties: isProduction,
    removeConsole: isProduction,
    styledComponents: {
      displayName: false,
      fileName: false,
      minify: isProduction,
      pure: true,
      ssr: true,
      transpileTemplateLiterals: true,
    },
  },
  devIndicators: false,
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "Content-Security-Policy",
          value: contentSecurityPolicy,
        },
        {
          key: "Cross-Origin-Opener-Policy",
          value: "same-origin",
        },
        {
          key: "Cross-Origin-Embedder-Policy",
          value: "credentialless",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        },
      ],
    },
  ],
  output: "export",
  productionBrowserSourceMaps: false,
  reactProductionProfiling: false,
  reactStrictMode: !isProduction,
  webpack: (config) => {
    // Use modern hash algorithm (OpenSSL 3.0 compatible)
    config.output.hashFunction = "xxhash64";

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
        const mod = resource.request.replace(/^node:/, "");

        switch (mod) {
          case "buffer":
            resource.request = "buffer";
            break;
          case "stream":
            resource.request = "readable-stream";
            break;
          default:
            throw new Error(`Not found ${mod}`);
        }
      }),
      new webpack.DefinePlugin({
        __REACT_DEVTOOLS_GLOBAL_HOOK__: "({ isDisabled: true })",
      })
    );

    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["MediaInfoModule.wasm"] = path.resolve(
      __dirname,
      "public/System/mediainfo.js/MediaInfoModule.wasm"
    );

    config.resolve.fallback = config.resolve.fallback || {};
    config.resolve.fallback.module = false;
    config.resolve.fallback.perf_hooks = false;

    config.module.parser.javascript = config.module.parser.javascript || {};
    config.module.parser.javascript.dynamicImportFetchPriority = "high";

    return config;
  },
};

module.exports = bundleAnalyzer
  ? require("@next/bundle-analyzer")({
      enabled: isProduction,
    })(nextConfig)
  : nextConfig;
