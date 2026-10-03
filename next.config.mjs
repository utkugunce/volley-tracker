const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' https://*.volleybox.net data: blob:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' https://*.vercel-storage.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com",
      "font-src 'self' data:",
      "manifest-src 'self'",
      "worker-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Lucide ikonlarının tüm paketi yerine yalnızca kullanılan ikonların import edilmesini sağlayarak derleme süresini ve bundle boyutunu düşürür
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.volleybox.net",
      },
    ],
  },
  async redirects() {
    // Eski `?city=<il>` adresleri (ör. /fikstur?city=istanbul) yol tabanlı sayfalara (/fikstur/istanbul) yönlenir.
    // Yalnızca ASCII slug değerleri yönlenir; diğer değerler (ör. `Tüm İller`, `all`) eskisi gibi tüm illeri gösteren ana sayfada kalır.
    // Ana sekme sayfaları artık searchParams okumadığı için statik/ISR olarak CDN'den servis edilir.
    const cityQuery = [{ type: "query", key: "city", value: "^(?<city>(?!all$)[A-Za-z0-9_-]+)$" }];
    return [
      { source: "/", has: cityQuery, destination: "/:city", permanent: false },
      ...["fikstur", "puan-durumu", "sonuclar", "gunun-maclari", "grup-durumu"].map((tab) => ({
        source: `/${tab}`,
        has: cityQuery,
        destination: `/${tab}/:city`,
        permanent: false,
      })),
    ];
  },
  async rewrites() {
    // Eski `/takim/<slug>?sehir=<il>` ve `?city=<il>` adresleri çalışmaya devam eder (URL değişmez);
    // içerik, arama parametresi okumayan statik/ISR `/takim/<slug>/<il>` rotasından gelir.
    return {
      beforeFiles: ["sehir", "city"].map((key) => ({
        source: "/takim/:slug",
        has: [{ type: "query", key, value: "(?<cityParam>[^/]+)" }],
        destination: "/takim/:slug/:cityParam",
      })),
    };
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
