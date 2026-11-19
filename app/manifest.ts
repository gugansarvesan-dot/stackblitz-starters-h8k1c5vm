import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SYSTEM // Hunter Tracker",
    short_name: "SYSTEM",
    description: "Daily Quest & Stat Leveling System",
    start_url: "/",
    display: "standalone",
    background_color: "#040812",
    theme_color: "#00d4ff",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
