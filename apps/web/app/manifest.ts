import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Der-Die-Das Master",
    short_name: "Der-Die-Das",
    description: "Learn German noun genders (der, die, das) through a fast, gamified practice loop.",
    start_url: "/play/A1",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
