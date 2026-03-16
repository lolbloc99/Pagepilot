"use client";

import { ScrapedProduct } from "@/lib/scrapers/types";

interface ProgressStepsProps {
  currentStep: "scraping" | "generating";
  product: ScrapedProduct | null;
}

export function ProgressSteps({ currentStep, product }: ProgressStepsProps) {
  const steps = [
    {
      id: "scraping",
      label: "Scraping product data",
      description: "Extracting title, images, price, and features...",
    },
    {
      id: "generating",
      label: "Generating content",
      description: "AI is writing compelling product page copy...",
    },
    {
      id: "building",
      label: "Building template",
      description: "Assembling your Shopify JSON template...",
    },
  ];

  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Generating your page...</h2>
        <p className="text-[var(--muted-foreground)]">
          This usually takes 15-30 seconds
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => {
          const isActive = i === currentIndex;
          const isDone = i < currentIndex;
          const isPending = i > currentIndex;

          return (
            <div
              key={step.id}
              className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                isActive
                  ? "bg-[var(--primary)]/10 border border-[var(--primary)]/30"
                  : isDone
                    ? "bg-[var(--success)]/5 border border-[var(--success)]/20"
                    : "bg-[var(--card)] border border-[var(--border)] opacity-50"
              }`}
            >
              <div className="mt-0.5 relative">
                {isDone ? (
                  <div className="w-6 h-6 rounded-full bg-[var(--success)] flex items-center justify-center">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ) : isActive ? (
                  <div className="w-6 h-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-[var(--border)]" />
                )}
              </div>
              <div>
                <p
                  className={`font-medium ${isDone ? "text-[var(--success)]" : isActive ? "text-white" : ""}`}
                >
                  {step.label}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {isDone && step.id === "scraping" && product
                    ? `Found: ${product.title.slice(0, 60)}...`
                    : step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
