import React from "react";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function GlobalJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://altyapivoleybol.com.tr";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "name": "Altyapı Voleybol",
    "alternateName": "Altyapı Voleybol Platformu",
    "url": baseUrl,
    "logo": `${baseUrl}/icon.svg`,
    "description": "Türkiye Voleybol Federasyonu (TVF) 81 İl Temsilciliği yerel ligleri ve TVF Kadınlar 2. Ligi resmi fikstür, canlı sonuç ve puan durumu takip platformu.",
    "foundingDate": "2024",
    "sport": "Volleyball",
    "areaServed": {
      "@type": "Country",
      "name": "Türkiye",
    },
    "sameAs": [
      "https://tvf.org.tr",
      "https://altyapivoleybol.com.tr",
    ],
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Altyapı Voleybol",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/kulupler?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
    </>
  );
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  if (!items || items.length === 0) return null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  if (!items || items.length === 0) return null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  );
}

export function SportsClubJsonLd({
  name,
  url,
  city,
  district,
  teams = [],
}: {
  name: string;
  url: string;
  city?: string;
  district?: string;
  teams?: string[];
}) {
  const clubSchema = {
    "@context": "https://schema.org",
    "@type": "SportsClub",
    "name": name,
    "sport": "Volleyball",
    "url": url,
    ...(city || district
      ? {
          "address": {
            "@type": "PostalAddress",
            "addressLocality": district || city,
            "addressRegion": city || "Türkiye",
            "addressCountry": "TR",
          },
        }
      : {}),
    ...(teams.length > 0
      ? {
          "subOrganization": teams.map((teamName) => ({
            "@type": "SportsTeam",
            "name": teamName,
            "sport": "Volleyball",
          })),
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(clubSchema) }}
    />
  );
}
