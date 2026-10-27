import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  HelpCircle,
  Share2,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { getAllGuides, getGuideBySlug, getRelatedGuides } from "@/data/guides";
import { ArticleJsonLd, FaqJsonLd, BreadcrumbJsonLd } from "@/components/JsonLd";

interface GuideDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const guides = getAllGuides();
  return guides.map((guide) => ({
    slug: guide.slug,
  }));
}

export async function generateMetadata({ params }: GuideDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {
      title: "Rehber Bulunamadı",
      description: "Aradığınız voleybol rehber sayfası bulunamadı.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://altyapivoleybol.com.tr";
  const url = `${baseUrl}/rehber/${guide.slug}`;

  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: url,
      type: "article",
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      section: guide.category,
      tags: guide.keywords,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://altyapivoleybol.com.tr";
  const currentUrl = `${baseUrl}/rehber/${guide.slug}`;
  const relatedGuides = getRelatedGuides(guide.slug);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Schema.org Yapısal Verileri (JSON-LD) */}
      <ArticleJsonLd
        title={guide.title}
        description={guide.description}
        url={currentUrl}
        datePublished={guide.publishedAt}
        dateModified={guide.updatedAt}
      />
      {guide.faqs.length > 0 && <FaqJsonLd items={guide.faqs} />}
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: baseUrl },
          { name: "Voleybol Rehberi", url: `${baseUrl}/rehber` },
          { name: guide.shortTitle, url: currentUrl },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 flex-1 w-full">
        {/* Üst Navigasyon & Ekmek Kırıntısı (Breadcrumbs) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line text-xs">
          <nav aria-label="Ekmek Kırıntısı" className="flex items-center gap-1.5 text-ink-3">
            <Link href="/" prefetch={false} className="hover:text-ink transition-colors">
              Ana Sayfa
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/rehber" prefetch={false} className="hover:text-ink transition-colors">
              Rehber
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-ink font-medium truncate max-w-[200px] sm:max-w-xs">
              {guide.shortTitle}
            </span>
          </nav>

          <Link
            href="/rehber"
            prefetch={false}
            className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tüm Rehberler</span>
          </Link>
        </div>

        {/* Makale Başlık & Üstbilgi (Header) */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {guide.category}
            </span>
            <span className="flex items-center gap-1 text-ink-3">
              <Clock className="w-3.5 h-3.5" />
              {guide.readTime}
            </span>
            <span className="text-ink-3">·</span>
            <span className="flex items-center gap-1 text-ink-3">
              <Calendar className="w-3.5 h-3.5" />
              Son Güncelleme: {guide.updatedAt}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-ink tracking-tight leading-tight">
            {guide.title}
          </h1>

          <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-sm border-l-4 border-l-primary space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Özet / Temel Bilgi</span>
            </div>
            <p className="text-sm text-ink-2 leading-relaxed">
              {guide.summary}
            </p>
          </div>
        </header>

        {/* İçindekiler Tablosu (Table of Contents) */}
        {guide.tableOfContents.length > 0 && (
          <nav
            aria-label="İçindekiler"
            className="p-4 sm:p-5 rounded-2xl bg-surface-muted border border-line space-y-3"
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>İçindekiler</span>
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {guide.tableOfContents.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="inline-flex items-center gap-1.5 text-ink-2 hover:text-primary transition-colors py-0.5"
                  >
                    <ChevronRight className="w-3 h-3 text-ink-3 shrink-0" />
                    <span>{item.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Makale Bölümleri */}
        <main className="space-y-10">
          {guide.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20 space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-ink border-b border-line pb-2">
                {section.title}
              </h2>

              <p className="text-sm sm:text-base text-ink-2 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>

              {/* Varsa Vurgu Kutusu */}
              {section.highlights && section.highlights.length > 0 && (
                <div className="p-4 rounded-xl bg-surface border border-line space-y-2">
                  <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Önemli Kurallar ve Kriterler:</span>
                  </div>
                  <ul className="space-y-1.5 pl-6 list-disc text-xs sm:text-sm text-ink-2">
                    {section.highlights.map((h, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Varsa Tablo */}
              {section.table && (
                <div className="overflow-x-auto no-scrollbar rounded-xl border border-line bg-surface shadow-sm">
                  {section.table.caption && (
                    <div className="px-4 py-2.5 bg-surface-muted text-xs font-bold text-ink border-b border-line">
                      {section.table.caption}
                    </div>
                  )}
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-line bg-canvas">
                        {section.table.headers.map((th, idx) => (
                          <th
                            key={idx}
                            className="px-4 py-3 font-black text-ink whitespace-nowrap"
                          >
                            {th}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {section.table.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className="hover:bg-surface-muted/50 transition-colors"
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`px-4 py-3 text-ink-2 whitespace-nowrap ${
                                cIdx === 0 ? "font-bold text-ink" : ""
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </main>

        {/* İlgili Altyapı Voleybol Araç ve Sayfaları (Internal Link CTAs) */}
        {guide.internalLinks.length > 0 && (
          <div className="space-y-3 pt-6 border-t border-line">
            <h3 className="text-sm font-black text-ink flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-primary" />
              <span>İlgili Altyapı Voleybol Sayfaları</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {guide.internalLinks.map((link, idx) => (
                <Link
                  key={idx}
                  href={link.url}
                  prefetch={false}
                  className="group p-4 rounded-2xl bg-surface hover:bg-surface-elevated border border-line hover:border-primary/60 transition-all shadow-card flex items-center justify-between"
                >
                  <div className="space-y-1">
                    {link.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {link.badge}
                      </span>
                    )}
                    <div className="text-xs sm:text-sm font-bold text-ink group-hover:text-primary transition-colors">
                      {link.title}
                    </div>
                    <div className="text-[11px] text-ink-2">
                      {link.description}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform shrink-0 ml-3" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sıkça Sorulan Sorular (FAQ) */}
        {guide.faqs.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-line">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black text-ink">
                Sıkça Sorulan Sorular (SSS)
              </h2>
            </div>
            <div className="space-y-3">
              {guide.faqs.map((faq, idx) => (
                <details
                  key={idx}
                  className="group bg-surface rounded-xl border border-line p-4 transition-colors open:bg-surface-elevated"
                >
                  <summary className="text-xs sm:text-sm font-bold text-ink cursor-pointer list-none flex items-center justify-between gap-3">
                    <span>{faq.question}</span>
                    <span className="text-primary font-mono text-base group-open:rotate-45 transition-transform shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="pt-3 text-xs sm:text-sm text-ink-2 leading-relaxed border-t border-line/60 mt-3">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* İlgili Diğer Rehberler */}
        {relatedGuides.length > 0 && (
          <aside className="space-y-4 pt-6 border-t border-line">
            <h3 className="text-base font-black text-ink">
              İlginizi Çekebilecek Diğer Kılavuzlar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedGuides.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/rehber/${rel.slug}`}
                  prefetch={false}
                  className="group p-4 rounded-xl bg-surface border border-line hover:border-primary/50 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-primary uppercase">
                      {rel.category}
                    </span>
                    <h4 className="text-xs font-bold text-ink group-hover:text-primary transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-primary inline-flex items-center gap-1 mt-3">
                    <span>Oku</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          </aside>
        )}

        {/* Alt Geri Dönüş Butonu */}
        <div className="pt-6 border-t border-line flex justify-center">
          <Link
            href="/rehber"
            prefetch={false}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-elevated border border-line text-xs font-bold text-ink transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tüm Rehberleri Görüntüle</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
