"use client";

import { useState } from "react";

interface CloneResultProps {
  data: {
    fullSection: string;
    liquidCode: string;
    cssCode: string;
    sectionSchema: string;
    sourceUrl: string;
    images: { src: string; alt: string }[];
  };
  onReset: () => void;
}

export function CloneResult({ data, onReset }: CloneResultProps) {
  const [activeTab, setActiveTab] = useState<
    "full" | "liquid" | "css" | "schema" | "images"
  >("full");
  const [copied, setCopied] = useState(false);

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

  const tabs = [
    { id: "full" as const, label: "Full Section (.liquid)" },
    { id: "liquid" as const, label: "Liquid/HTML" },
    { id: "css" as const, label: "CSS" },
    { id: "schema" as const, label: "Schema" },
    { id: "images" as const, label: `Images (${data.images?.length || 0})` },
  ];

  const contentMap = {
    full: data.fullSection,
    liquid: data.liquidCode,
    css: data.cssCode,
    schema: data.sectionSchema,
    images: "",
  };

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
        <div className="flex gap-3">
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
        </div>
      </div>

      {/* How to use */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-sm">
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
    </div>
  );
}
