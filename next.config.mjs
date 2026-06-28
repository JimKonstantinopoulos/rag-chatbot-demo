/** @type {import('next').NextConfig} */
const nextConfig = {
  // unpdf and the AI SDKs run in the Node.js runtime on the server only.
  serverExternalPackages: ["unpdf"],
};

export default nextConfig;
