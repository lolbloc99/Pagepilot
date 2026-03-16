"use client";

import { useState } from "react";
import { ScrapedProduct } from "@/lib/scrapers/types";
import { GeneratedContent } from "@/lib/ai/generate-content";

interface TemplatePreviewProps {
  content: GeneratedContent;
  product: ScrapedProduct;
}

export function TemplatePreview({ content, product }: TemplatePreviewProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  const price = product.price;
  const images = product.images;

  return (
    <div className="space-y-4">
      {/* Viewport toggle */}
      <div className="flex items-center gap-2 justify-end">
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

      {/* Preview frame */}
      <div className={`bg-white text-gray-900 rounded-xl overflow-hidden shadow-2xl border border-[var(--border)] mx-auto transition-all duration-300 ${viewport === "mobile" ? "max-w-[390px]" : "max-w-full"}`}>
        <div className="overflow-y-auto max-h-[700px] shopify-preview">

          {/* ===== MAIN PRODUCT SECTION ===== */}
          <section className={`${viewport === "mobile" ? "p-4" : "p-8"}`}>
            <div className={`${viewport === "mobile" ? "space-y-4" : "grid grid-cols-2 gap-10"}`}>
              {/* Product images */}
              <div>
                {images.length > 0 && (
                  <div className="space-y-3">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={images[currentImage]?.url} alt={images[currentImage]?.alt || product.title} className="w-full h-full object-cover" />
                    </div>
                    {images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {images.slice(0, 6).map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImage(i)}
                            className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors ${currentImage === i ? "border-black" : "border-transparent"}`}
                          >
                            <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="space-y-4">
                {/* Trustpilot stars */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <svg key={i} className="w-4 h-4 text-[#00b67a]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">({content.reviewCount} Reviews)</span>
                </div>

                {/* Title */}
                <h1 className={`font-bold leading-tight ${viewport === "mobile" ? "text-xl" : "text-2xl"}`}>{content.title}</h1>
                {content.subtitle && <p className="text-gray-500">{content.subtitle}</p>}

                {/* Badge texts */}
                {content.iconTexts && content.iconTexts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {content.iconTexts.map((text, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {text}
                      </span>
                    ))}
                  </div>
                )}

                {/* Icon features */}
                {content.iconFeatures && content.iconFeatures.length > 0 && (
                  <div className="flex gap-6 py-2">
                    {content.iconFeatures.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl text-gray-700">{feat.icon}</span>
                        <span className="text-sm font-medium">{feat.heading}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className={`font-bold ${viewport === "mobile" ? "text-xl" : "text-2xl"}`}>
                    {price.currency === "USD" ? "$" : price.currency === "EUR" ? "€" : price.currency}{price.amount.toFixed(2)}
                  </span>
                  {price.compareAt && (
                    <span className="text-gray-400 line-through text-lg">
                      {price.currency === "USD" ? "$" : price.currency === "EUR" ? "€" : price.currency}{price.compareAt.toFixed(2)}
                    </span>
                  )}
                  {price.compareAt && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded">
                      -{Math.round((1 - price.amount / price.compareAt) * 100)}%
                    </span>
                  )}
                </div>

                {/* Variants */}
                {product.variants.length > 1 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Options</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.slice(0, 6).map((v, i) => (
                        <button key={i} className={`px-4 py-2 border rounded-lg text-sm transition-colors ${i === 0 ? "border-black bg-gray-50 font-medium" : "border-gray-200 hover:border-gray-400"}`}>
                          {v.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add to cart */}
                <div className="space-y-2 pt-2">
                  <button className="w-full py-3.5 bg-black text-white font-medium rounded-lg text-sm hover:bg-gray-800 transition-colors">
                    Add to Cart
                  </button>
                  <button className="w-full py-3.5 bg-[#5a31f4] text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2">
                    <span className="font-bold italic">Shop</span> Pay
                  </button>
                </div>

                {/* Description */}
                {content.description && (
                  <div className="pt-2 text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.description }} />
                )}

                {/* Collapsible tabs */}
                {content.collapsibleTabs && content.collapsibleTabs.length > 0 && (
                  <div className="border-t pt-4 space-y-0 divide-y">
                    {content.collapsibleTabs.map((tab, i) => (
                      <details key={i} className="group">
                        <summary className="flex items-center justify-between py-3 cursor-pointer font-medium text-sm">
                          {tab.heading}
                          <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </summary>
                        <div className="pb-3 text-sm text-gray-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: tab.content }} />
                      </details>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ===== IMAGE WITH TEXT SECTIONS ===== */}
          {content.imageWithText && content.imageWithText.length > 0 && content.imageWithText.map((section, i) => (
            <section key={`iwt-${i}`} className={`${i % 2 === 0 ? "bg-gray-50" : "bg-white"} ${viewport === "mobile" ? "p-4 py-8" : "p-8 py-16"}`}>
              <div className={`${viewport === "mobile" ? "space-y-4" : "grid grid-cols-2 gap-10 items-center"} max-w-5xl mx-auto`}>
                <div className={`${i % 2 === 1 && viewport !== "mobile" ? "order-2" : ""}`}>
                  {images[i + 1] ? (
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                      <img src={images[i + 1].url} alt={images[i + 1].alt || section.heading} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] rounded-xl bg-gray-100 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                    </div>
                  )}
                </div>
                <div className={`space-y-3 ${i % 2 === 1 && viewport !== "mobile" ? "order-1" : ""}`}>
                  <h2 className={`font-bold leading-tight ${viewport === "mobile" ? "text-xl" : "text-2xl"}`}>{section.heading}</h2>
                  <p className="text-gray-600 leading-relaxed">{section.body}</p>
                </div>
              </div>
            </section>
          ))}

          {/* ===== CUSTOM COLUMNS / FEATURES ===== */}
          {content.customColumnFeatures && content.customColumnFeatures.length > 0 && (
            <section className={`bg-white ${viewport === "mobile" ? "p-4 py-8" : "p-8 py-16"}`}>
              <div className={`${viewport === "mobile" ? "space-y-6" : "grid grid-cols-2 gap-8"} max-w-4xl mx-auto`}>
                {content.customColumnFeatures.map((feat, i) => (
                  <div key={i} className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="font-semibold text-lg">{feat.title}</h3>
                    <p className="text-gray-500 text-sm">{feat.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ===== MULTIROW FEATURES ===== */}
          {content.multirowSections && content.multirowSections.length > 0 && (
            <section className={`bg-gray-50 ${viewport === "mobile" ? "p-4 py-8" : "p-8 py-16"}`}>
              <div className="max-w-5xl mx-auto space-y-10">
                {content.multirowSections.map((row, i) => (
                  <div key={i} className={`${viewport === "mobile" ? "space-y-4" : "grid grid-cols-2 gap-10 items-center"}`}>
                    <div className={`${i % 2 === 1 && viewport !== "mobile" ? "order-2" : ""}`}>
                      {images[content.imageWithText.length + i + 1] ? (
                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                          <img src={images[content.imageWithText.length + i + 1].url} alt={row.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] rounded-xl bg-gray-200 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                        </div>
                      )}
                    </div>
                    <div className={`space-y-2 ${i % 2 === 1 && viewport !== "mobile" ? "order-1" : ""}`}>
                      <h3 className={`font-bold ${viewport === "mobile" ? "text-lg" : "text-xl"}`}>{row.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{row.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ===== COMPARISON TABLE ===== */}
          {content.comparisonTable && content.comparisonTable.benefits.length > 0 && (
            <section className={`bg-white ${viewport === "mobile" ? "p-4 py-8" : "p-8 py-16"}`}>
              <div className="max-w-3xl mx-auto">
                <h2 className={`font-bold text-center mb-8 ${viewport === "mobile" ? "text-xl" : "text-2xl"}`}>{content.comparisonTable.title}</h2>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-3 text-sm font-semibold">Benefit</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold">Us</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-400">Others</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {content.comparisonTable.benefits.map((b, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-sm">{b}</td>
                          <td className="px-4 py-3 text-center">
                            <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <svg className="w-5 h-5 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ===== REVIEWS ===== */}
          {content.reviews && content.reviews.length > 0 && (
            <section className={`bg-gray-50 ${viewport === "mobile" ? "p-4 py-8" : "p-8 py-16"}`}>
              <div className="max-w-5xl mx-auto">
                <h2 className={`font-bold text-center mb-8 ${viewport === "mobile" ? "text-xl" : "text-2xl"}`}>What Our Customers Say</h2>
                <div className={`${viewport === "mobile" ? "space-y-4" : "grid grid-cols-3 gap-6"}`}>
                  {content.reviews.map((review, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <div className="flex gap-0.5 mb-3">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} className="w-4 h-4 text-[#00b67a]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))}
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{review.title}</h4>
                      <p className="text-sm text-gray-500 mb-3">{review.text}</p>
                      <p className="text-xs text-gray-400 font-medium">{review.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
