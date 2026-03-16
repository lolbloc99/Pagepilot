"use client";

import { useState } from "react";
import Link from "next/link";
import { UrlForm } from "@/components/url-form";
import { ProgressSteps } from "@/components/progress-steps";
import { ResultView } from "@/components/result-view";
import { CloneForm } from "@/components/clone-form";
import { CloneResult } from "@/components/clone-result";
import { ScrapedProduct } from "@/lib/scrapers/types";

type Mode = "generate" | "clone";
type Step = "idle" | "scraping" | "generating" | "cloning" | "done" | "error";

export default function Home() {
  const [mode, setMode] = useState<Mode>("generate");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string>("");
  const [product, setProduct] = useState<ScrapedProduct | null>(null);
  const [template, setTemplate] = useState<object | null>(null);
  const [generatedContent, setGeneratedContent] = useState<object | null>(null);
  const [cloneData, setCloneData] = useState<{
    fullSection: string;
    liquidCode: string;
    cssCode: string;
    sectionSchema: string;
    sourceUrl: string;
    images: { src: string; alt: string }[];
  } | null>(null);

  async function handleGenerate(url: string, language: string, tone: string) {
    setStep("scraping");
    setError("");
    setProduct(null);
    setTemplate(null);
    setGeneratedContent(null);

    try {
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!scrapeRes.ok) {
        const data = await scrapeRes.json();
        throw new Error(data.error || "Failed to scrape product");
      }

      const { product: scrapedProduct } = await scrapeRes.json();
      setProduct(scrapedProduct);
      setStep("generating");

      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: scrapedProduct, language, tone }),
      });

      if (!generateRes.ok) {
        const data = await generateRes.json();
        throw new Error(data.error || "Failed to generate content");
      }

      const result = await generateRes.json();
      setTemplate(result.template);
      setGeneratedContent(result.content);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("error");
    }
  }

  async function handleClone(url: string, language: string) {
    setStep("cloning");
    setError("");
    setCloneData(null);

    try {
      const res = await fetch("/api/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, language }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to clone page");
      }

      const result = await res.json();
      setCloneData(result);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("error");
    }
  }

  function handleReset() {
    setStep("idle");
    setError("");
    setProduct(null);
    setTemplate(null);
    setGeneratedContent(null);
    setCloneData(null);
  }

  function switchMode(newMode: Mode) {
    handleReset();
    setMode(newMode);
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm">
              PF
            </div>
            <h1 className="text-xl font-semibold">PageForge</h1>
          </div>
          <nav className="flex items-center gap-6">
            <span className="text-sm text-white font-medium">
              Generator
            </span>
            <Link
              href="/shops"
              className="text-sm text-[var(--muted-foreground)] hover:text-white transition-colors"
            >
              Shops
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Mode Tabs */}
        {step === "idle" && (
          <div className="flex justify-center mb-10">
            <div className="flex gap-1 bg-[var(--card)] p-1 rounded-xl">
              <button
                onClick={() => switchMode("generate")}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === "generate"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--muted-foreground)] hover:text-white"
                }`}
              >
                Generate Page
              </button>
              <button
                onClick={() => switchMode("clone")}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === "clone"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--muted-foreground)] hover:text-white"
                }`}
              >
                Clone Page
              </button>
            </div>
          </div>
        )}

        {/* Generate Mode */}
        {mode === "generate" && step === "idle" && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold mb-4">
                Generate Product Pages{" "}
                <span className="text-[var(--primary)]">in Seconds</span>
              </h2>
              <p className="text-[var(--muted-foreground)] text-lg">
                Paste a product URL from Shopify, AliExpress, or Amazon. Get a
                complete, high-converting Shopify product page template.
              </p>
            </div>
            <UrlForm onSubmit={handleGenerate} />
          </div>
        )}

        {/* Clone Mode */}
        {mode === "clone" && step === "idle" && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold mb-4">
                Clone Any Page{" "}
                <span className="text-[var(--primary)]">into Liquid</span>
              </h2>
              <p className="text-[var(--muted-foreground)] text-lg">
                Collez l&apos;URL d&apos;une page produit concurrente. On la
                clone en section Liquid Shopify prete a utiliser.
              </p>
            </div>
            <CloneForm onSubmit={handleClone} />
          </div>
        )}

        {/* Progress */}
        {(step === "scraping" || step === "generating") && (
          <div className="max-w-lg mx-auto">
            <ProgressSteps currentStep={step} product={product} />
          </div>
        )}

        {step === "cloning" && (
          <div className="max-w-lg mx-auto text-center space-y-6">
            <h2 className="text-2xl font-bold">Cloning page...</h2>
            <p className="text-[var(--muted-foreground)]">
              Scraping HTML/CSS and converting to Shopify Liquid. This takes
              20-40 seconds.
            </p>
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full border-3 border-[var(--primary)] border-t-transparent animate-spin" />
            </div>
            <div className="space-y-3 text-left max-w-md mx-auto">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30">
                <div className="w-5 h-5 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                <span className="text-sm">
                  Fetching page HTML &amp; CSS...
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--card)] border border-[var(--border)] opacity-50">
                <div className="w-5 h-5 rounded-full border-2 border-[var(--border)]" />
                <span className="text-sm">
                  Converting to Shopify Liquid...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6">
              <p className="text-red-400 font-medium mb-2">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {step === "done" && mode === "generate" && template && product && (
          <ResultView
            template={template}
            product={product}
            content={generatedContent}
            onReset={handleReset}
          />
        )}

        {step === "done" && mode === "clone" && cloneData && (
          <CloneResult data={cloneData} onReset={handleReset} />
        )}
      </div>
    </main>
  );
}
