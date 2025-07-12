/** @type {import('next').NextConfig} */
const nextConfig = {
  // The webpack customizations were causing the server to crash.
  // Removing them allows the server to start successfully.
};

export default nextConfig;
