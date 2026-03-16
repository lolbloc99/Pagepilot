"use client";

import { useState } from "react";
import { ScrapedProduct } from "@/lib/scrapers/types";
import { GeneratedContent } from "@/lib/ai/generate-content";
import { ShopifyPush } from "./shopify-push";
import { TemplatePreview } from "./template-preview";

interface ResultViewProps {
  template: object;
  product: ScrapedProduct;
  content: object | null;
  onReset: () => void;
}

export function ResultView({
  template,
  product,
  content,
  onReset,
}: ResultViewProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "json" | "content" | "images">(
    "preview"
  );
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleCopy() {
    const text = JSON.stringify(template, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          images: product.images,
          productTitle: product.title,
        }),
      });

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pageforge-${product.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloading(false);
    }
  }

  const tabs = [
    { id: "preview" as const, label: "Preview" },
    { id: "json" as const, label: "Template JSON" },
    { id: "content" as const, label: "Generated Content" },
    { id: "images" as const, label: `Images (${product.images.length})` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Page Generated!</h2>
          <p className="text-[var(--muted-foreground)]">
            {product.title.slice(0, 80)}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2.5 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg transition-colors text-sm"
          >
            New Page
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg transition-colors text-sm"
          >
            {copied ? "Copied!" : "Copy JSON"}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-50 rounded-lg transition-colors text-sm font-medium"
          >
            {downloading ? "Downloading..." : "Download ZIP"}
          </button>
          <ShopifyPush template={template} productTitle={product.title} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--card)] p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              activeTab === tab.id
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--muted-foreground)] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "preview" && content && (
        <TemplatePreview content={content as GeneratedContent} product={product} />
      )}

      <div className={`bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden ${activeTab === "preview" ? "hidden" : ""}`}>
        {activeTab === "json" && (
          <pre className="p-6 overflow-auto max-h-[600px] text-sm text-green-400 font-mono leading-relaxed">
            {JSON.stringify(template, null, 2)}
          </pre>
        )}

        {activeTab === "content" && content && (
          <div className="p-6 space-y-6 max-h-[600px] overflow-auto">
            <ContentPreview content={content as Record<string, unknown>} />
          </div>
        )}

        {activeTab === "images" && (
          <div className="p-6 grid grid-cols-4 gap-4 max-h-[600px] overflow-auto">
            {product.images.map((img, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg overflow-hidden bg-[var(--secondary)]"
              >
                <img
                  src={img.url}
                  alt={img.alt || `Product image ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {product.images.length === 0 && (
              <p className="col-span-4 text-center text-[var(--muted-foreground)] py-12">
                No images found
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ContentPreview({ content }: { content: Record<string, unknown> }) {
  const title = content.title as string;
  const subtitle = content.subtitle as string;
  const description = content.description as string;
  const iconTexts = content.iconTexts as string[];
  const collapsibleTabs = content.collapsibleTabs as {
    heading: string;
    content: string;
  }[];
  const reviews = content.reviews as {
    title: string;
    text: string;
    author: string;
  }[];

  return (
    <>
      <div>
        <h3 className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
          Title
        </h3>
        <p className="text-xl font-bold">{title}</p>
        {subtitle && (
          <p className="text-[var(--muted-foreground)] mt-1">{subtitle}</p>
        )}
      </div>

      {iconTexts && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
            Key Points
          </h3>
          <div className="flex flex-wrap gap-2">
            {iconTexts.map((text, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-[var(--secondary)] rounded-full text-sm"
              >
                {text}
              </span>
            ))}
          </div>
        </div>
      )}

      {description && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
            Description
          </h3>
          <div
            className="prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      )}

      {collapsibleTabs && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
            Collapsible Tabs
          </h3>
          <div className="space-y-2">
            {collapsibleTabs.map((tab, i) => (
              <details
                key={i}
                className="bg-[var(--secondary)] rounded-lg overflow-hidden"
              >
                <summary className="px-4 py-3 cursor-pointer font-medium">
                  {tab.heading}
                </summary>
                <div
                  className="px-4 pb-3 text-sm text-[var(--muted-foreground)]"
                  dangerouslySetInnerHTML={{ __html: tab.content }}
                />
              </details>
            ))}
          </div>
        </div>
      )}

      {reviews && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
            Reviews
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {reviews.map((review, i) => (
              <div key={i} className="bg-[var(--secondary)] rounded-lg p-4">
                <p className="font-medium text-sm mb-1">{review.title}</p>
                <p className="text-sm text-[var(--muted-foreground)] mb-2">
                  {review.text}
                </p>
                <p className="text-xs text-[var(--primary)]">
                  - {review.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
