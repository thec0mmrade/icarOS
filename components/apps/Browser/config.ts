import { type ProxyState } from "components/apps/Browser/useProxyMenu";
import { FAVICON_BASE_PATH, ICON_PATH } from "utils/constants";

type Bookmark = {
  icon: string;
  name: string;
  path?: string;
  url: string;
};

type WaybackUrlInfo = {
  archived_snapshots: { closest: { url: string } };
};

export const bookmarks: Bookmark[] = [
  {
    icon: FAVICON_BASE_PATH,
    name: "c0mmrade",
    url: "https://c0mmrade.com/",
  },
  {
    icon: "https://www.c0mmrade.com/favicon.ico",
    name: "whoami",
    url: "https://www.c0mmrade.com/whoami/",
  },
  {
    icon: `${ICON_PATH}/Favicons/dir.webp`,
    name: "Index of /",
    url: "http://localhost/",
  },
  {
    icon: `${ICON_PATH}/Favicons/google.webp`,
    name: "Google",
    url: "https://www.google.com/webhp?igu=1",
  },
  {
    icon: `${ICON_PATH}/Favicons/wikipedia.webp`,
    name: "Wikipedia",
    url: "https://www.wikipedia.org/",
  },
  {
    icon: `${ICON_PATH}/Favicons/archive.webp`,
    name: "Internet Archive",
    url: "https://archive.org/",
  },
  {
    icon: `${ICON_PATH}/webamp.webp`,
    name: "Winamp Skin Museum",
    url: "https://skins.webamp.org/",
  },
  {
    icon: "https://dallasmakerspace.org/favicon.ico",
    name: "Dallas Makerspace",
    url: "https://dallasmakerspace.org/",
  },
];

export const HOME_PAGE = "https://www.google.com/webhp?igu=1";

export const NOT_FOUND =
  '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN"><html><head><title>404 Not Found</title><style>h1{display:inline;}</style></head><body><h1>Not Found</h1><p>The requested URL was not found on this server.</p></body></html>';

const OLD_NET_PROXY =
  "https://theoldnet.com/get?scripts=true&decode=true&year=<year>&url=";

export const OLD_NET_SUPPORTED_YEARS = [
  1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008,
  2009, 2010, 2011, 2012,
];

const WAYBACK_URL_INFO = "https://archive.org/wayback/available?url=";

export const PROXIES: Record<
  ProxyState,
  ((url: string) => Promise<string> | string) | undefined
> = {
  ALL_ORIGINS: (url) => `https://api.allorigins.win/raw?url=${url}`,
  CORS: undefined,
  CORS_IO: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  CORS_LOL: (url) => `https://api.cors.lol/?url=${encodeURIComponent(url)}`,
  WAYBACK_MACHINE: async (url) => {
    try {
      const urlInfoResponse = await fetch(`${WAYBACK_URL_INFO}${url}`);
      const { archived_snapshots } =
        (await urlInfoResponse.json()) as WaybackUrlInfo;

      if (archived_snapshots.closest.url) {
        let addressUrl = archived_snapshots.closest.url;

        if (
          addressUrl.startsWith("http:") &&
          window.location.protocol === "https:"
        ) {
          addressUrl = addressUrl.replace("http:", "https:");
        }

        return addressUrl;
      }
    } catch {
      // Ignore failure to fetch url
    }

    return url;
  },
  ...Object.fromEntries(
    OLD_NET_SUPPORTED_YEARS.map((year) => [
      `OLD_NET_${year}`,
      (url) => `${OLD_NET_PROXY.replace("<year>", year.toString())}${url}`,
    ])
  ),
};
