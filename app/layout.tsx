import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.vertexconsultingltd.com"),

  title: {
    default: "VERTEX CONSULTING LTD | IT Solutions & Digital Transformation",
    template: "%s | VERTEX CONSULTING LTD",
  },

  description:
    "VERTEX CONSULTING LTD is a leading IT consulting company in Rwanda providing software development, cloud solutions, cybersecurity, and digital transformation services for modern businesses.",

  applicationName: "VERTEX CONSULTING LTD",

  keywords: [
    "Vertex Consulting Rwanda",
    "IT company Kigali",
    "software development Rwanda",
    "web development Kigali",
    "cloud computing Rwanda",
    "cybersecurity services Africa",
    "digital transformation Rwanda",
  ],

  authors: [{ name: "VERTEX CONSULTING LTD", url: "https://www.vertexconsultingltd.com" }],
  creator: "VERTEX CONSULTING LTD",
  publisher: "VERTEX CONSULTING LTD",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  category: "technology",

  classification: "Business, Technology, IT Services",

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: "https://www.vertexconsultingltd.com",
    languages: {
      "en-US": "https://www.vertexconsultingltd.com",
    },
  },

  openGraph: {
    title: "VERTEX CONSULTING LTD | IT Solutions & Innovation",
    description:
      "Empowering businesses with advanced IT consulting, custom software development, and scalable digital solutions.",
    url: "https://www.vertexconsultingltd.com",
    siteName: "VERTEX CONSULTING LTD",
    images: [
      {
        url: "./vertex1.png",
        width: 1200,
        height: 630,
        alt: "Vertex Consulting LTD - Digital Solutions",
      },
      {
        url: "/vertex1.png",
        width: 1200,
        height: 630,
        alt: "Vertex Consulting Team & Services",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "VERTEX CONSULTING LTD",
    description:
      "Innovative IT solutions, cloud services, and software development.",
    creator: "@vertexconsulting",
    images: ["/vertex1.png"],
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },

  manifest: "/site.webmanifest",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vertex Consulting",
  },

  other: {
    "geo.region": "RW",
    "geo.placename": "Kigali",
    "geo.position": "-1.9441;30.0619",
    "ICBM": "-1.9441, 30.0619",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/*  STRUCTURED DATA (VERY POWERFUL SEO BOOST) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "VERTEX CONSULTING LTD",
                url: "https://www.vertexconsultingltd.com",
                logo: "https://www.vertexconsultingltd.com/vertex1.png",
                sameAs: [
                  "https://www.facebook.com/",
                  "https://www.linkedin.com/",
                  "https://twitter.com/",
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                name: "VERTEX CONSULTING LTD",
                image: "https://www.vertexconsultingltd.com/vertex1.png",
                "@id": "https://www.vertexconsultingltd.com",
                url: "https://www.vertexconsultingltd.com",
                telephone: "+250-XXX-XXX-XXX",
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "Kigali",
                  addressLocality: "Kigali",
                  addressRegion: "Kigali City",
                  postalCode: "00000",
                  addressCountry: "RW",
                },
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: -1.9441,
                  longitude: 30.0619,
                },
              },
            ]),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}