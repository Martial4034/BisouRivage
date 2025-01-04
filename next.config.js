/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['storage.googleapis.com', 'firebasestorage.googleapis.com'], // Ajoutez votre domaine ici
      },
}

module.exports = nextConfig
