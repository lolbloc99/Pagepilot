import { GeneratedContent } from "../ai/generate-content";

let counter = 0;
function blockId(prefix: string): string {
  counter++;
  return `${prefix}_${counter.toString(36).padStart(6, "0")}`;
}

function resetIds(): void {
  counter = 0;
}

function richtext(text: string): string {
  if (!text) return "<p></p>";
  if (text.startsWith("<p>") || text.startsWith("<ul>") || text.startsWith("<ol>")) return text;
  return `<p>${text}</p>`;
}

function inlineRichtext(text: string): string {
  return text || "";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildShopifyTemplate(content: GeneratedContent): object {
  resetIds();

  // ── Main Product Section ────────────────────────────────────────────
  const titleBlockId = blockId("title");
  const ratingStarsId = blockId("rating_stars");
  const priceId = blockId("price");
  const variantPickerId = blockId("variant_picker");
  const quantitySelectorId = blockId("quantity_selector");
  const buyButtonsId = blockId("buy_buttons");
  const shippingCheckpointsId = blockId("shipping_checkpoints");
  const stickyAtcId = blockId("sticky_atc");
  const descriptionId = blockId("description");
  const paymentBadgesId = blockId("payment_badges");
  const reviewsBlockId = blockId("reviews");
  const textBlockId = blockId("text");
  const iconWithTextId = blockId("icon_with_text");
  const emojiBenefitsId = blockId("emoji_benefits");

  const collapsibleTabIds = content.collapsibleTabs.map(() => blockId("collapsible_tab"));

  const mainProductBlocks: Record<string, object> = {
    [titleBlockId]: {
      type: "title",
      settings: {
        text_size: "h1",
        title_alignment: "left",
        uppercase_title: false,
        margin_top: 0,
        margin_bottom: 0,
      },
    },
    [ratingStarsId]: {
      type: "rating_stars",
      settings: {
        rating: 4.8,
        star_color: "#ffcc00",
        bg_stars_style: "full",
        bg_star_color: "#ececec",
        label: `<strong>4.8</strong> (${content.reviewCount} Reviews)`,
        size: 16,
        alignment: "flex-start",
        scroll_id: "",
        margin_top: 3,
        margin_bottom: 9,
      },
    },
    [priceId]: {
      type: "price",
      settings: {
        layout: "price_first",
        price_color: "accent-1",
        compare_price_color: "text",
        margin_top: 9,
        margin_bottom: 9,
      },
    },
    [textBlockId]: {
      type: "text",
      settings: {
        text_1: content.iconTexts[0] || "",
        text_2: content.iconTexts[1] || "",
        text_3: content.iconTexts[2] || "",
        icon_1: "check_circle",
        filled_icon_1: false,
        icon_2: "check_circle",
        filled_icon_2: false,
        icon_3: "check_circle",
        filled_icon_3: false,
        direction: "horizontal",
        enable_bg: false,
        margin_top: 9,
        margin_bottom: 12,
      },
    },
    [iconWithTextId]: {
      type: "icon_with_text",
      settings: {
        layout: "horizontal",
        icon_color: "accent-1",
        icon_1: content.iconFeatures[0]?.icon || "favorite",
        heading_1: content.iconFeatures[0]?.heading || "",
        icon_2: content.iconFeatures[1]?.icon || "undo",
        heading_2: content.iconFeatures[1]?.heading || "",
        icon_3: content.iconFeatures[2]?.icon || "local_shipping",
        heading_3: content.iconFeatures[2]?.heading || "",
        margin_top: 12,
        margin_bottom: 15,
      },
    },
    [variantPickerId]: {
      type: "variant_picker",
      settings: {
        picker_types: "pills, dropdown, dropdown",
        custom_labels: "[name] - [selected]",
        swatches_size: "medium",
        breaks_style: "normal",
        breaks_headline: "",
        breaks_color_scheme: "accent-1",
        breaks_badges: "",
        breaks_labels: "",
        breaks_benefits: "",
        breaks_captions: "",
        breaks_price_texts: "",
        breaks_compare_price_texts: "",
        margin_top: 9,
        margin_bottom: 0,
      },
    },
    [quantitySelectorId]: {
      type: "quantity_selector",
      disabled: true,
      settings: {
        style: "normal",
        headline: "BUNDLE & SAVE",
        preselected: "option_1",
        color_scheme: "accent-1",
        enable_variant_selectors: true,
        option_1_quantity: 1,
        option_1_badge: "",
        option_1_label: "Buy [quantity]",
        option_1_benefit: "",
        option_1_caption: "",
        option_1_percentage_off_text: "0",
        option_1_fixed_amount_off: "0",
        option_1_price_text: "[price]",
        option_1_compare_price: "compare_price",
        option_1_compare_price_text: "[compare_price]",
        option_2_quantity: 2,
        option_2_badge: "Most Popular",
        option_2_label: "Buy [quantity]",
        option_2_benefit: "Save 10%",
        option_2_caption: "",
        option_2_percentage_off_text: "10",
        option_2_fixed_amount_off: "0",
        option_2_price_text: "[price]",
        option_2_compare_price: "compare_price",
        option_2_compare_price_text: "[compare_price]",
        option_3_quantity: 3,
        option_3_badge: "Best Value",
        option_3_label: "Buy [quantity]",
        option_3_benefit: "Save 15%",
        option_3_caption: "",
        option_3_percentage_off_text: "15",
        option_3_fixed_amount_off: "0",
        option_3_price_text: "[price]",
        option_3_compare_price: "compare_price",
        option_3_compare_price_text: "[compare_price]",
        option_4_quantity: 4,
        option_4_badge: "",
        option_4_label: "Buy [quantity]",
        option_4_benefit: "Save 20%",
        option_4_caption: "",
        option_4_percentage_off_text: "20",
        option_4_fixed_amount_off: "0",
        option_4_price_text: "[price]",
        option_4_compare_price: "compare_price",
        option_4_compare_price_text: "[compare_price]",
        margin_top: 12,
        margin_bottom: 12,
      },
    },
    [buyButtonsId]: {
      type: "buy_buttons",
      settings: {
        show_dynamic_checkout: false,
        skip_cart: false,
        uppercase_text: true,
        icon_scale: 120,
        display_price: false,
        enable_custom_color: false,
        margin_top: 12,
        margin_bottom: 0,
      },
    },
    [shippingCheckpointsId]: {
      type: "shipping_checkpoints",
      settings: {
        icon_1: "inventory_2",
        top_text_1: "Order Placed",
        bottom_text_1: "Today",
        min_days_1: 0,
        max_days_1: 0,
        icon_2: "local_shipping",
        top_text_2: "Shipped",
        bottom_text_2: "",
        min_days_2: 1,
        max_days_2: 3,
        icon_3: "flight",
        top_text_3: "In Transit",
        bottom_text_3: "",
        min_days_3: 7,
        max_days_3: 10,
        icon_4: "home",
        top_text_4: "Delivered",
        bottom_text_4: "",
        min_days_4: 10,
        max_days_4: 15,
        date_format: "mm_dd",
        color_scheme: "inverse",
        margin_top: 15,
        margin_bottom: 15,
      },
    },
    [paymentBadgesId]: {
      type: "payment_badges",
      settings: {
        enabled_payment_types: "visa,mastercard,amex,paypal,apple_pay,google_pay",
        margin_top: 0,
        margin_bottom: 9,
      },
    },
    [stickyAtcId]: {
      type: "sticky_atc",
      settings: {
        function: "add_to_cart",
        display_when: "after_scroll",
        button_label: "",
        color_scheme: "background-1",
      },
    },
    [descriptionId]: {
      type: "description",
      settings: {
        margin_top: 24,
        margin_bottom: 15,
      },
    },
    [emojiBenefitsId]: {
      type: "emoji_benefits",
      settings: {
        benefits: richtext(
          content.iconFeatures
            .map((f) => `\u2705 ${escapeHtml(f.heading)}`)
            .join("<br/>")
        ),
        margin_top: 0,
        margin_bottom: 15,
      },
    },
    [reviewsBlockId]: {
      type: "reviews",
      settings: {
        color_scheme: "background-1",
        corner_radius: 12,
        star_color: "#ffcc00",
        checkmark_color: "#6d388b",
        slider_type: "slide",
        display_dots: true,
        author_1: content.reviews[0]
          ? `<em><strong>${escapeHtml(content.reviews[0].author)}</strong></em>`
          : "",
        text_1: content.reviews[0] ? richtext(escapeHtml(content.reviews[0].text)) : "",
        author_2: content.reviews[1]
          ? `<em><strong>${escapeHtml(content.reviews[1].author)}</strong></em>`
          : "",
        text_2: content.reviews[1] ? richtext(escapeHtml(content.reviews[1].text)) : "",
        author_3: content.reviews[2]
          ? `<em><strong>${escapeHtml(content.reviews[2].author)}</strong></em>`
          : "",
        text_3: content.reviews[2] ? richtext(escapeHtml(content.reviews[2].text)) : "",
        margin_top: 15,
        margin_bottom: 15,
      },
    },
    ...Object.fromEntries(
      collapsibleTabIds.map((id, i) => [
        id,
        {
          type: "collapsible_tab",
          settings: {
            heading: content.collapsibleTabs[i].heading,
            heading_size: "medium",
            icon: content.collapsibleTabs[i].icon || "check_box",
            collapse_icon: "carret",
            display_top_border: true,
            open: false,
            content: richtext(content.collapsibleTabs[i].content),
            margin_top: 0,
            margin_bottom: 0,
          },
        },
      ])
    ),
  };

  const mainProductBlockOrder = [
    titleBlockId,
    ratingStarsId,
    priceId,
    textBlockId,
    iconWithTextId,
    variantPickerId,
    quantitySelectorId,
    buyButtonsId,
    shippingCheckpointsId,
    paymentBadgesId,
    stickyAtcId,
    descriptionId,
    emojiBenefitsId,
    reviewsBlockId,
    ...collapsibleTabIds,
  ];

  // ── Rich Text (Hero subtitle / hook) ────────────────────────────────
  const richTextSectionId = blockId("rich_text_section");
  const rtHeadingId = blockId("rt_heading");
  const rtTextId = blockId("rt_text");

  const richTextSection = {
    type: "rich-text",
    blocks: {
      [rtHeadingId]: {
        type: "heading",
        settings: {
          title: `<strong>${escapeHtml(content.title)}</strong>`,
          title_highlight_color: "#6d388b",
          heading_size: "h1",
        },
      },
      [rtTextId]: {
        type: "text",
        settings: {
          text: richtext(escapeHtml(content.subtitle)),
        },
      },
    },
    block_order: [rtHeadingId, rtTextId],
    settings: {
      desktop_content_position: "center",
      content_alignment: "center",
      color_scheme: "background-1",
      padding_top: 40,
      padding_bottom: 52,
    },
  };

  // ── Section Divider 1 ───────────────────────────────────────────────
  const divider1Id = blockId("divider_1");
  const divider1 = {
    type: "section-divider",
    settings: {
      shape: "waves_3",
      flip_horizontal: false,
      flip_vertical: false,
      shape_color: "accent-1",
      background_color: "background-1",
    },
  };

  // ── Icons With Content (Key Features) ───────────────────────────────
  const iconsContentId = blockId("icons_content");
  const iconsHeadingBlockId = blockId("icons_heading");
  const iconsTextBlockId = blockId("icons_text");
  const iconBlocks: Record<string, object> = {};
  const iconBlockOrder: string[] = [];

  // Heading block
  iconBlocks[iconsHeadingBlockId] = {
    type: "heading",
    settings: {
      title: "<strong>Why You'll Love It</strong>",
      title_highlight_color: "#6d388b",
      heading_size: "h1",
    },
  };
  iconBlockOrder.push(iconsHeadingBlockId);

  // Caption / intro text
  iconBlocks[iconsTextBlockId] = {
    type: "text",
    settings: {
      text: richtext(escapeHtml(content.subtitle)),
    },
  };
  iconBlockOrder.push(iconsTextBlockId);

  // Icon blocks from customColumnFeatures (reuse as icon_with_text features)
  const featureSource =
    content.customColumnFeatures.length > 0
      ? content.customColumnFeatures
      : content.iconFeatures.map((f) => ({ title: f.heading, text: "" }));

  featureSource.forEach((feature) => {
    const iconId = blockId("icon");
    iconBlocks[iconId] = {
      type: "icon",
      settings: {
        icon: "check_circle",
        filled_icon: false,
        title: escapeHtml(feature.title),
        text: richtext(escapeHtml(feature.text || "")),
      },
    };
    iconBlockOrder.push(iconId);
  });

  const iconsWithContentSection = {
    type: "icons-with-content",
    blocks: iconBlocks,
    block_order: iconBlockOrder,
    settings: {
      icon_size: "m",
      icon_position: "next-to-title",
      icon_color: "accent-1",
      icon_heading_size: "h3",
      icon_text_alignment: "left",
      icons_desktop_layout: "2-column",
      layout: "image_first",
      color_scheme: "background-1",
      padding_top: 36,
      padding_bottom: 36,
    },
  };

  // ── Section Divider 2 ───────────────────────────────────────────────
  const divider2Id = blockId("divider_2");
  const divider2 = {
    type: "section-divider",
    settings: {
      shape: "diagonal_1",
      flip_horizontal: false,
      flip_vertical: true,
      shape_color: "accent-1",
      background_color: "background-1",
    },
  };

  // ── Comparison Table ────────────────────────────────────────────────
  const comparisonId = blockId("comparison");
  const compRowIds = content.comparisonTable.benefits.map(() => blockId("comp_row"));
  const comparisonBlocks = Object.fromEntries(
    compRowIds.map((id, i) => [
      id,
      {
        type: "row",
        settings: {
          benefit: `<strong>${escapeHtml(content.comparisonTable.benefits[i] || "Benefit")}</strong>`,
          us: true,
          others: false,
        },
      },
    ])
  );

  const comparisonTableSection = {
    type: "comparison-table",
    blocks: comparisonBlocks,
    block_order: compRowIds,
    settings: {
      title: inlineRichtext(content.comparisonTable.title || "Why Choose Us?"),
      title_highlight_color: "#6D388B",
      heading_size: "h1",
      layout: "table_second",
      style: "classic",
      corner_radius: 20,
      number_of_competitors: 1,
      us_label: "[shop_name]",
      others_label: "Others",
      checkmark_style: "regular",
      checkmark_color: "#53AF01",
      x_color: "#121212",
      highlighted_color_scheme: "accent-1",
      color_scheme: "background-1",
      padding_top: 36,
      padding_bottom: 36,
    },
  };

  // ── Image With Text ─────────────────────────────────────────────────
  const imageWithTextSections: Record<string, object> = {};
  const imageWithTextOrder: string[] = [];

  content.imageWithText.forEach((section, i) => {
    const sectionId = blockId("iwt_section");
    const headId = blockId("iwt_heading");
    const txtId = blockId("iwt_text");

    imageWithTextSections[sectionId] = {
      type: "image-with-text",
      blocks: {
        [headId]: {
          type: "heading",
          settings: {
            title: escapeHtml(section.heading),
            title_highlight_color: "#6d388b",
            heading_size: "h2",
          },
        },
        [txtId]: {
          type: "text",
          settings: {
            text: richtext(escapeHtml(section.body)),
          },
        },
      },
      block_order: [headId, txtId],
      settings: {
        height: "adapt",
        layout: i % 2 === 0 ? "image_first" : "text_first",
        desktop_content_position: "top",
        desktop_content_alignment: "left",
        color_scheme: "background-1",
        padding_top: 36,
        padding_bottom: 36,
      },
    };
    imageWithTextOrder.push(sectionId);
  });

  // ── Section Divider 3 ───────────────────────────────────────────────
  const divider3Id = blockId("divider_3");
  const divider3 = {
    type: "section-divider",
    settings: {
      shape: "curved_1",
      flip_horizontal: false,
      flip_vertical: false,
      shape_color: "accent-1",
      background_color: "background-1",
    },
  };

  // ── Testimonials ────────────────────────────────────────────────────
  const testimonialsId = blockId("testimonials");
  const testimonialColumnIds = content.reviews.map(() => blockId("testimonial_col"));
  const testimonialBlocks = Object.fromEntries(
    testimonialColumnIds.map((id, i) => [
      id,
      {
        type: "column",
        settings: {
          title: content.reviews[i]?.title || "Amazing product!",
          text: richtext(escapeHtml(content.reviews[i]?.text || "")),
          author: `<strong>${escapeHtml(content.reviews[i]?.author || "Verified Customer")}</strong>`,
        },
      },
    ])
  );

  const testimonialsSection = {
    type: "testimonials",
    blocks: testimonialBlocks,
    block_order: testimonialColumnIds,
    settings: {
      title: `<strong>What Our Customers Say</strong>`,
      title_highlight_color: "#6d388b",
      heading_size: "h1",
      show_stars: true,
      stars_color: "#ffd700",
      show_quotes: true,
      cards_color_scheme: "bg-overlay",
      columns_desktop: Math.min(content.reviews.length, 3),
      slider_desktop: false,
      color_scheme: "background-1",
      padding_top: 36,
      padding_bottom: 36,
    },
  };

  // ── Section Divider 4 ───────────────────────────────────────────────
  const divider4Id = blockId("divider_4");
  const divider4 = {
    type: "section-divider",
    settings: {
      shape: "waves_3",
      flip_horizontal: true,
      flip_vertical: false,
      shape_color: "accent-1",
      background_color: "background-1",
    },
  };

  // ── FAQ Section (sp-faq) ────────────────────────────────────────────
  const faqSectionId = blockId("faq");
  // Build FAQ from collapsibleTabs content
  const faqItems = content.collapsibleTabs.length > 0
    ? content.collapsibleTabs
    : [
        { heading: "How long does shipping take?", content: "Orders typically arrive within 7-15 business days.", icon: "" },
        { heading: "What is your return policy?", content: "We offer a 30-day money-back guarantee on all orders.", icon: "" },
        { heading: "Is this product high quality?", content: "Yes, all our products are carefully tested and inspected.", icon: "" },
        { heading: "Do you offer customer support?", content: "Our team is available 24/7 to assist you.", icon: "" },
        { heading: "Can I track my order?", content: "Yes, you will receive a tracking number once your order ships.", icon: "" },
      ];

  const faqQuestionIds = faqItems.map(() => blockId("faq_q"));
  const faqBlocks = Object.fromEntries(
    faqQuestionIds.map((id, i) => [
      id,
      {
        type: "question",
        settings: {
          question: `<b>${escapeHtml(faqItems[i].heading)}</b>`,
          answer: richtext(escapeHtml(faqItems[i].content)),
        },
      },
    ])
  );

  const faqSection = {
    type: "sp-faq",
    blocks: faqBlocks,
    block_order: faqQuestionIds,
    settings: {
      headline: "<strong>Frequently Asked Questions</strong>",
      text: "",
      question_text_size: 25,
      question_color: "#111111",
      answer_color: "#555555",
      text_alignment: "center",
      container_max_width: 1000,
      color_scheme: "background-1",
      padding_top: 36,
      padding_bottom: 36,
    },
  };

  // ── Related Products (disabled) ─────────────────────────────────────
  const relatedProductsId = blockId("related");
  const relatedProducts = {
    type: "related-products",
    disabled: true,
    settings: {
      title: "You may also like",
      title_highlight_color: "#6d388b",
      heading_size: "h2",
      products_to_show: 4,
      columns_desktop: 4,
      color_scheme: "background-1",
      image_ratio: "adapt",
      show_secondary_image: false,
      show_vendor: false,
      show_rating: false,
      enable_quick_add: false,
      columns_mobile: "2",
      padding_top: 36,
      padding_bottom: 24,
    },
  };

  // ── Assemble Template ───────────────────────────────────────────────
  const sections: Record<string, object> = {};
  const order: string[] = [];

  // 1. Main product
  const mainId = "main";
  sections[mainId] = {
    type: "main-product",
    blocks: mainProductBlocks,
    block_order: mainProductBlockOrder,
    settings: {
      enable_sticky_info: true,
      media_size: "medium",
      media_position: "left",
      gallery_layout: "thumbnail_slider",
      media_fit: "contain",
      trust_badge_position: "top-right",
      padding_top: 36,
      padding_bottom: 36,
    },
  };
  order.push(mainId);

  // 2. Rich text hero
  sections[richTextSectionId] = richTextSection;
  order.push(richTextSectionId);

  // 3. Divider
  sections[divider1Id] = divider1;
  order.push(divider1Id);

  // 4. Icons with content
  sections[iconsContentId] = iconsWithContentSection;
  order.push(iconsContentId);

  // 5. Divider
  sections[divider2Id] = divider2;
  order.push(divider2Id);

  // 6. Comparison table
  sections[comparisonId] = comparisonTableSection;
  order.push(comparisonId);

  // 7. Image with text sections
  for (let i = 0; i < imageWithTextOrder.length; i++) {
    const id = imageWithTextOrder[i];
    sections[id] = imageWithTextSections[id];
    order.push(id);
  }

  // 8. Divider
  sections[divider3Id] = divider3;
  order.push(divider3Id);

  // 9. Testimonials
  sections[testimonialsId] = testimonialsSection;
  order.push(testimonialsId);

  // 10. Divider
  sections[divider4Id] = divider4;
  order.push(divider4Id);

  // 11. FAQ
  sections[faqSectionId] = faqSection;
  order.push(faqSectionId);

  // 12. Related products (disabled)
  sections[relatedProductsId] = relatedProducts;
  order.push(relatedProductsId);

  return {
    layout: "theme",
    sections,
    order,
  };
}
