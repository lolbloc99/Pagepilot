"use client";

import { useState, useMemo } from "react";
import { ShopifyPush } from "./shopify-push";

interface CloneResultProps {
  data: {
    fullSection: string;
    liquidCode: string;
    cssCode: string;
    sectionSchema: string;
    sourceUrl: string;
    previewHtml?: string;
    images: { src: string; alt: string }[];
  };
  onReset: () => void;
}

export function CloneResult({ data, onReset }: CloneResultProps) {
  const [activeTab, setActiveTab] = useState<
    "preview" | "full" | "liquid" | "css" | "schema" | "images"
  >("preview");
  const [copied, setCopied] = useState(false);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  async function handleCopy(content: string) {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = content;
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

  function handleDownloadLiquid() {
    const blob = new Blob([data.fullSection], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cloned-section.liquid";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadCss() {
    const blob = new Blob([data.cssCode], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cloned-section.css";
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabs = [
    { id: "preview" as const, label: "Preview" },
    { id: "full" as const, label: "Full Section (.liquid)" },
    { id: "liquid" as const, label: "Liquid/HTML" },
    { id: "css" as const, label: "CSS" },
    { id: "schema" as const, label: "Schema" },
    { id: "images" as const, label: `Images (${data.images?.length || 0})` },
  ];

  const contentMap = {
    preview: "",
    full: data.fullSection,
    liquid: data.liquidCode,
    css: data.cssCode,
    schema: data.sectionSchema,
    images: "",
  };

  const fakeTemplate = useMemo(() => ({
    layout: "theme",
    sections: {
      "cloned-section": {
        type: "cloned-section",
        settings: {},
      },
    },
    order: ["cloned-section"],
    _liquid: data.fullSection,
  }), [data.fullSection]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Page Cloned!</h2>
          <p className="text-[var(--muted-foreground)] text-sm">
            Source: {data.sourceUrl}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <button
            onClick={onReset}
            className="px-4 py-2.5 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg transition-colors text-sm"
          >
            New Clone
          </button>
          <button
            onClick={() => handleCopy(contentMap[activeTab] || data.fullSection)}
            className="px-4 py-2.5 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg transition-colors text-sm"
          >
            {copied ? "Copied!" : "Copy Code"}
          </button>
          <button
            onClick={handleDownloadLiquid}
            className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg transition-colors text-sm font-medium"
          >
            Download .liquid
          </button>
          {data.cssCode.length > 100000 && (
            <button
              onClick={handleDownloadCss}
              className="px-4 py-2.5 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg transition-colors text-sm"
            >
              Download CSS
            </button>
          )}
          <ShopifyPush template={fakeTemplate} productTitle="cloned-section" />
        </div>
      </div>

      {/* Stats + How to use */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-sm">
        <div className="flex items-center gap-4 mb-3 text-xs text-[var(--muted-foreground)]">
          <span>HTML: {(data.liquidCode.length / 1024).toFixed(0)}KB</span>
          <span>CSS: {(data.cssCode.length / 1024).toFixed(0)}KB</span>
          <span>Total: {(data.fullSection.length / 1024).toFixed(0)}KB</span>
          {data.images?.length > 0 && <span>{data.images.length} images</span>}
        </div>
        <p className="font-medium mb-2">
          Pour utiliser dans Shopify :
        </p>
        <ol className="list-decimal list-inside space-y-1 text-[var(--muted-foreground)]">
          <li>
            Allez dans <strong className="text-white">Online Store &gt; Themes &gt; Edit code</strong>
          </li>
          <li>
            Dans <strong className="text-white">Sections</strong>, cliquez{" "}
            <strong className="text-white">Add a new section</strong>
          </li>
          <li>
            Collez le contenu du fichier <strong className="text-white">.liquid</strong>
          </li>
          <li>
            Ajoutez la section a votre page via le{" "}
            <strong className="text-white">Theme Editor</strong>
          </li>
        </ol>
        {data.fullSection.length > 256000 && (
          <p className="mt-2 text-yellow-400 text-xs">
            ⚠️ Le fichier est volumineux ({(data.fullSection.length / 1024).toFixed(0)}KB).
            Si Shopify rejette le fichier, copiez le CSS dans <strong>Assets &gt; cloned-section.css</strong>
            et remplacez le bloc &lt;style&gt; par: {"{{ 'cloned-section.css' | asset_url | stylesheet_tag }}"}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--card)] p-1 rounded-lg w-fit flex-wrap">
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

      {/* Preview tab — uses original scraped HTML/CSS for accurate rendering */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-xs text-[var(--muted-foreground)] mr-2">
              Preview from original page
            </span>
            <button
              onClick={() => setViewport("desktop")}
              className={`p-2 rounded-lg transition-colors ${viewport === "desktop" ? "bg-[var(--primary)] text-white" : "bg-[var(--secondary)] text-[var(--muted-foreground)]"}`}
              title="Desktop"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg>
            </button>
            <button
              onClick={() => setViewport("mobile")}
              className={`p-2 rounded-lg transition-colors ${viewport === "mobile" ? "bg-[var(--primary)] text-white" : "bg-[var(--secondary)] text-[var(--muted-foreground)]"}`}
              title="Mobile"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
            </button>
          </div>
          <div className={`bg-white rounded-xl overflow-hidden shadow-2xl border border-[var(--border)] mx-auto transition-all duration-300 ${viewport === "mobile" ? "max-w-[390px]" : "max-w-full"}`}>
            {data.previewHtml ? (
              <iframe
                srcDoc={data.previewHtml}
                className="w-full border-0"
                style={{ height: "700px" }}
                sandbox="allow-same-origin"
                title="Clone preview"
              />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-400">
                Preview not available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code tabs */}
      {activeTab !== "preview" && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
          {activeTab !== "images" && (
            <pre className="p-6 overflow-auto max-h-[600px] text-sm font-mono leading-relaxed text-green-400 whitespace-pre-wrap">
              {contentMap[activeTab]}
            </pre>
          )}

          {activeTab === "images" && (
            <div className="p-6 grid grid-cols-4 gap-4 max-h-[600px] overflow-auto">
              {data.images?.map((img, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-square rounded-lg overflow-hidden bg-[var(--secondary)]">
                    <img
                      src={img.src}
                      alt={img.alt || `Image ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">
                    {img.alt || img.src.split("/").pop()}
                  </p>
                </div>
              ))}
              {(!data.images || data.images.length === 0) && (
                <p className="col-span-4 text-center text-[var(--muted-foreground)] py-12">
                  No images found
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
