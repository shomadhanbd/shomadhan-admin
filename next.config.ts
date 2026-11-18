import type { NextConfig } from "next";

// Every request goes to the API from the browser; without it they would hit the admin's own address and 404.
if (process.env.NODE_ENV === "production") {
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api || !URL.canParse(api)) {
    throw new Error("NEXT_PUBLIC_API_URL must be the API's address, e.g. https://api.example.com/api/v1.");
  }
}

const nextConfig: NextConfig = {};

export default nextConfig;
