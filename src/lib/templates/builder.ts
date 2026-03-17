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

  // ═══════════════════════════════════════════════════════════════════
  // MAIN PRODUCT SECTION
  // Order: trustpilot_stars → title → text → icon_with_text →
  //        variant_picker → quantity_selector(disabled) → buy_buttons →
  //        payment_badges → description → collapsible_tabs
  // ═══════════════════════════════════════════════════════════════════

  const trustpilotStarsId = blockId("trustpilot_stars");
  const titleBlockId = blockId("title");
  const textBlockId = blockId("text");
  const iconWithTextId = blockId("icon_with_text");
  const variantPickerId = blockId("variant_picker");
  const quantitySelectorId = blockId("quantity_selector");
  const buyButtonsId = blockId("buy_buttons");
  const paymentBadgesId = blockId("payment_badges");
  const descriptionId = blockId("description");

  const collapsibleTabIds = content.collapsibleTabs.map(() => blockId("collapsible_tab"));

  // Get icon texts for the text block
  const iconTexts = content.iconTexts || [];

  const mainProductBlocks: Record<string, object> = {
    [trustpilotStarsId]: {
      type: "trustpilot_stars",
      settings: {
        rating: 5,
        star_color: "#00b67a",
        bg_star_color: "#c8c8c8",
        star_symbol_color: "#ffffff",
        label: `(${content.reviewCount} Reviews)`,
        size: 16,
        alignment: "center",
        scroll_id: "",
        margin_top: 15,
        margin_bottom: 15,
      },
    },
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
    [textBlockId]: {
      type: "text",
      settings: {
        mobile_text_size: 14,
        desktop_text_size: 16,
        alignment: "center",
        text_color: "#121212",
        text_1: iconTexts[0] || "Text with icon",
        text_2: iconTexts[1] || "",
        text_3: iconTexts[2] || "",
        icon_scale: 120,
        icon_color: "#121212",
        icon_1: "",
        filled_icon_1: false,
        icon_2: "check_circle",
        filled_icon_2: false,
        icon_3: "check_circle",
        filled_icon_3: false,
        width: "100%",
        direction: "horizontal",
        column_gap: 3,
        enable_bg: false,
        bg_color: "#f3f3f3",
        corner_radius: 40,
        padding: 3,
        border_size: 0,
        border_color: "#b7b7b7",
        margin_top: 6,
        margin_bottom: 0,
      },
    },
    [iconWithTextId]: {
      type: "icon_with_text",
      settings: {
        layout: "horizontal",
        icon_color: "accent-1",
        desktop_icon_size: 48,
        desktop_spacing: 12,
        desktop_text_size: 18,
        mobile_icon_size: 40,
        mobile_spacing: 10,
        mobile_text_size: 14,
        icon_1: content.iconFeatures[0]?.icon || "favorite",
        icon_1_fill: false,
        heading_1: content.iconFeatures[0]?.heading || "Heading",
        icon_2: content.iconFeatures[1]?.icon || "undo",
        icon_2_fill: false,
        heading_2: content.iconFeatures[1]?.heading || "Heading",
        icon_3: content.iconFeatures[2]?.icon || "local_shipping",
        icon_3_fill: false,
        heading_3: content.iconFeatures[2]?.heading || "Heading",
        margin_top: 24,
        margin_bottom: 24,
      },
    },
    [variantPickerId]: {
      type: "variant_picker",
      settings: {
        picker_types: "quantity breaks",
        custom_labels: "[name] - [selected]",
        skip_unavailable: false,
        swatches_size: "medium",
        swatches_custom_colors: "disabled",
        swatches_custom_colors_list: "#000000, #6D388B, #0000FF, #FFCC00",
        full_width_dropdowns: true,
        breaks_style: "vertical",
        breaks_headline: "",
        breaks_display_selected_indicator: true,
        breaks_border_radius: 10,
        breaks_border_width: 2,
        breaks_color_scheme: "accent-1",
        breaks_badges: "Stock Faible, \u00c9puis\u00e9,\u00c9puis\u00e9",
        breaks_badge_style: "1",
        breaks_badge_color: "accent-1",
        breaks_displayed_images: "variant_images",
        breaks_custom_images: "",
        breaks_image_width: 70,
        breaks_space_images: true,
        breaks_vertical_images_position: "top",
        breaks_vertical_prices_layout: "vertical",
        breaks_labels: "[name], [name], [name]",
        breaks_benefits: "",
        breaks_benefit_position: "top",
        breaks_benefit_style: "outlined",
        breaks_benefit_color: "accent-1",
        breaks_captions: "",
        breaks_price_texts: "[price], [price], [price]",
        breaks_compare_price_texts: "[compare_price], [compare_price], [compare_price]",
        margin_top: 6,
        margin_bottom: 0,
      },
    },
    [quantitySelectorId]: {
      type: "quantity_selector",
      disabled: true,
      settings: {
        full_width_classic: false,
        atc_append: "none",
        atc_append_heights: "stretch-quantity",
        enable_quantity_discounts: false,
        style: "normal",
        headline: "BUNDLE & SAVE",
        preselected: "option_1",
        display_selected_indicator: true,
        border_radius: 10,
        border_width: 2,
        color_scheme: "accent-1",
        enable_variant_selectors: true,
        enable_variant_selectors_on_quantity_of_1: false,
        update_prices: false,
        skip_unavailable: false,
        full_width_pickers: false,
        hide_pickers_overlay: true,
        pickers_label: "",
        image_width: 70,
        space_images: true,
        vertical_images_position: "top",
        vertical_prices_layout: "vertical",
        option_1_quantity: 1,
        option_1_badge: "",
        option_1_badge_style: "1",
        option_1_badge_color: "accent-1",
        option_1_label: "Buy [quantity]",
        option_1_benefit: "",
        option_1_benefit_position: "top",
        option_1_benefit_style: "outlined",
        option_1_benefit_color: "accent-1",
        option_1_caption: "You save [amount_saved]",
        option_1_percentage_off_text: "0",
        option_1_fixed_amount_off: "0",
        option_1_price_text: "[price]",
        option_1_compare_price: "compare_price",
        option_1_compare_price_text: "[compare_price]",
        option_2_quantity: 2,
        option_2_badge: "",
        option_2_badge_style: "1",
        option_2_badge_color: "accent-1",
        option_2_label: "Buy [quantity]",
        option_2_benefit: "",
        option_2_benefit_position: "top",
        option_2_benefit_style: "outlined",
        option_2_benefit_color: "accent-1",
        option_2_caption: "You save [amount_saved]",
        option_2_percentage_off_text: "0",
        option_2_fixed_amount_off: "0",
        option_2_price_text: "[price]",
        option_2_compare_price: "compare_price",
        option_2_compare_price_text: "[compare_price]",
        option_3_quantity: 3,
        option_3_badge: "",
        option_3_badge_style: "1",
        option_3_badge_color: "accent-1",
        option_3_label: "Buy [quantity]",
        option_3_benefit: "",
        option_3_benefit_position: "top",
        option_3_benefit_style: "outlined",
        option_3_benefit_color: "accent-1",
        option_3_caption: "You save [amount_saved]",
        option_3_percentage_off_text: "0",
        option_3_fixed_amount_off: "0",
        option_3_price_text: "[price]",
        option_3_compare_price: "compare_price",
        option_3_compare_price_text: "[compare_price]",
        option_4_quantity: 4,
        option_4_badge: "",
        option_4_badge_style: "1",
        option_4_badge_color: "accent-1",
        option_4_label: "Buy [quantity]",
        option_4_benefit: "",
        option_4_benefit_position: "top",
        option_4_benefit_style: "outlined",
        option_4_benefit_color: "accent-1",
        option_4_caption: "You save [amount_saved]",
        option_4_percentage_off_text: "0",
        option_4_fixed_amount_off: "0",
        option_4_price_text: "[price]",
        option_4_compare_price: "compare_price",
        option_4_compare_price_text: "[compare_price]",
        margin_top: 15,
        margin_bottom: 15,
      },
    },
    [buyButtonsId]: {
      type: "buy_buttons",
      settings: {
        show_dynamic_checkout: false,
        skip_cart: true,
        uppercase_text: true,
        icon_scale: 120,
        icon_spacing: 10,
        display_price: true,
        enable_custom_color: false,
        custom_color: "#53af01",
        enable_secondary_btn: false,
        secondary_btn_label: "Buy It Now",
        secondary_btn_enable_custom_color: false,
        secondary_btn_custom_color: "#dd1d1d",
        margin_top: 15,
        margin_bottom: 0,
      },
    },
    [paymentBadgesId]: {
      type: "payment_badges",
      settings: {
        enabled_payment_types: "apple_pay,google_pay,visa,master",
        margin_top: 0,
        margin_bottom: 6,
      },
    },
    [descriptionId]: {
      type: "description",
      settings: {
        margin_top: 24,
        margin_bottom: 24,
      },
    },
    ...Object.fromEntries(
      collapsibleTabIds.map((id, i) => [
        id,
        {
          type: "collapsible_tab",
          settings: {
            heading: content.collapsibleTabs[i]?.heading || "Collapsible row",
            heading_size: "small",
            icon: "",
            filled_icon: false,
            collapse_icon: "carret",
            display_top_border: true,
            open: false,
            content: richtext(content.collapsibleTabs[i]?.content || ""),
            page: "",
            margin_top: 24,
            margin_bottom: 0,
          },
        },
      ])
    ),
  };

  const mainProductBlockOrder = [
    trustpilotStarsId,
    titleBlockId,
    textBlockId,
    iconWithTextId,
    variantPickerId,
    quantitySelectorId,
    buyButtonsId,
    paymentBadgesId,
    descriptionId,
    ...collapsibleTabIds,
  ];

  // ═══════════════════════════════════════════════════════════════════
  // IMAGE WITH TEXT 1
  // ═══════════════════════════════════════════════════════════════════
  const iwt1Id = blockId("image_with_text");
  const iwt1HeadingId = blockId("iwt1_heading");
  const iwt1TextId = blockId("iwt1_text");

  const iwt1 = content.imageWithText[0];

  const imageWithText1Section = {
    type: "image-with-text",
    blocks: {
      [iwt1HeadingId]: {
        type: "heading",
        settings: {
          title: escapeHtml(iwt1?.heading || "Image with text"),
          title_highlight_color: "#6d388b",
          heading_size: "h2",
        },
      },
      [iwt1TextId]: {
        type: "text",
        settings: {
          text: richtext(escapeHtml(iwt1?.body || "Pair text with an image to focus on your chosen product, collection, or blog post. Add details on availability, style, or even provide a review.")),
          text_style: "body",
        },
      },
    },
    block_order: [iwt1HeadingId, iwt1TextId],
    settings: {
      display_id: false,
      visibility: "always-display",
      video_autoplay: true,
      video_loop: true,
      height: "adapt",
      color_scheme: "background-1",
      section_color_scheme: "background-1",
      full_desktop_width: false,
      content_layout: "no-overlap",
      desktop_media_width: 50,
      layout: "image_first",
      desktop_content_position: "top",
      desktop_content_alignment: "left",
      mobile_full_media_width: false,
      mobile_direction: "normal",
      mobile_image_quanlity: "2",
      mobile_content_alignment: "left",
      mobile_padding_top: 0,
      mobile_padding_bottom: 12,
      desktop_padding_top: 36,
      desktop_padding_bottom: 36,
      custom_colors_background: "#2e2a39",
      custom_gradient_background: "",
      custom_colors_text: "#ffffff",
      custom_colors_solid_button_background: "#dd1d1d",
      custom_colors_solid_button_text: "#ffffff",
      custom_colors_outline_button: "#dd1d1d",
      custom_section_colors_background: "#ffffff",
      custom_section_gradient_background: "",
    },
  };

  // ═══════════════════════════════════════════════════════════════════
  // CUSTOM COLUMNS
  // ═══════════════════════════════════════════════════════════════════
  const customColumnsId = blockId("custom_columns");
  const ccBlocks: Record<string, object> = {};
  const ccBlockOrder: string[] = [];

  const features = content.customColumnFeatures.length > 0
    ? content.customColumnFeatures
    : content.iconFeatures.map((f) => ({ title: f.heading, text: f.heading }));

  // First feature in col_1
  if (features[0]) {
    const id = blockId("cc_icon");
    ccBlocks[id] = {
      type: "icon_with_text",
      settings: {
        column: "col_1",
        visibility: "always-display",
        icon: "check_circle",
        filled_icon: false,
        icon_size: "m",
        icon_position: "next-to-title",
        icon_color: "accent-1",
        icon_heading_size: "h3",
        icon_text_alignment: "left",
        title: escapeHtml(features[0].title),
        text: richtext(escapeHtml(features[0].text || "")),
        margin_top: 20,
        margin_bottom: 20,
      },
    };
    ccBlockOrder.push(id);
  }

  // Remaining features in col_2
  features.slice(1).forEach((f, i) => {
    const id = blockId("cc_icon");
    ccBlocks[id] = {
      type: "icon_with_text",
      settings: {
        column: "col_2",
        visibility: "always-display",
        icon: "check_circle",
        filled_icon: false,
        icon_size: "m",
        icon_position: "next-to-title",
        icon_color: "accent-1",
        icon_heading_size: "h3",
        icon_text_alignment: "left",
        title: escapeHtml(f.title),
        text: richtext(escapeHtml(f.text || "")),
        margin_top: i === 0 ? 20 : 12,
        margin_bottom: i === 0 ? 30 : 0,
      },
    };
    ccBlockOrder.push(id);
  });

  const customColumnsSection = {
    type: "custom-columns",
    blocks: ccBlocks,
    block_order: ccBlockOrder,
    settings: {
      display_id: false,
      visibility: "always-display",
      color_scheme: "background-1",
      columns_count: 4,
      column_gap_desktop: 40,
      row_gap_desktop: 40,
      desktop_vertical_alignment: "center",
      column_gap_mobile: 20,
      row_gap_mobile: 30,
      mobile_vertical_alignment: "flex-start",
      col_1_desktop_width: 12,
      col_1_mobile_width: 4,
      col_1_visibility: "always-display",
      col_2_desktop_width: 4,
      col_2_mobile_width: 4,
      col_2_visibility: "always-display",
      col_3_desktop_width: 4,
      col_3_mobile_width: 4,
      col_3_visibility: "always-display",
      col_4_desktop_width: 4,
      col_4_mobile_width: 4,
      col_4_visibility: "always-display",
      col_5_desktop_width: 3,
      col_5_mobile_width: 4,
      col_5_visibility: "always-display",
      col_6_desktop_width: 3,
      col_6_mobile_width: 4,
      col_6_visibility: "always-display",
      padding_top: 12,
      padding_bottom: 0,
      custom_colors_background: "#ffffff",
      custom_gradient_background: "",
      custom_colors_text: "#2e2a39",
      custom_colors_solid_button_background: "#dd1d1d",
      custom_colors_solid_button_text: "#ffffff",
      custom_colors_outline_button: "#dd1d1d",
    },
  };

  // ═══════════════════════════════════════════════════════════════════
  // MULTIROW
  // ═══════════════════════════════════════════════════════════════════
  const multirowId = blockId("multirow");
  const multirowBlocks: Record<string, object> = {};
  const multirowBlockOrder: string[] = [];

  const iwtSource = content.imageWithText.length > 1
    ? content.imageWithText.slice(1)
    : [
        { heading: "Row", body: "Pair text with an image to focus on your chosen product, collection, or blog post. Add details on availability, style, or even provide a review." },
        { heading: "Row", body: "Pair text with an image to focus on your chosen product, collection, or blog post. Add details on availability, style, or even provide a review." },
      ];

  iwtSource.forEach((section) => {
    const rowId = blockId("row");
    multirowBlocks[rowId] = {
      type: "row",
      settings: {
        video_muted_autoplay: true,
        caption: "",
        title: escapeHtml(section.heading || "Row"),
        title_highlight_color: "#6d388b",
        text: richtext(escapeHtml(section.body || "")),
        button_label: "",
        button_link: "",
        atc_button_label: "",
        atc_product: "",
        atc_skip_cart: false,
      },
    };
    multirowBlockOrder.push(rowId);
  });

  const multirowSection = {
    type: "multirow",
    blocks: multirowBlocks,
    block_order: multirowBlockOrder,
    settings: {
      display_id: false,
      visibility: "always-display",
      image_height: "medium",
      desktop_image_width: "medium",
      heading_size: "h1",
      text_style: "body",
      button_style: "secondary",
      desktop_content_position: "middle",
      desktop_content_alignment: "left",
      image_layout: "alternate-left",
      row_color_scheme: "background-1",
      section_color_scheme: "background-1",
      mobile_full_media_width: false,
      mobile_direction: "normal",
      mobile_content_alignment: "left",
      padding_top: 0,
      padding_bottom: 12,
      custom_colors_background: "#2e2a39",
      custom_gradient_background: "",
      custom_colors_text: "#ffffff",
      custom_colors_solid_button_background: "#dd1d1d",
      custom_colors_solid_button_text: "#ffffff",
      custom_colors_outline_button: "#dd1d1d",
      custom_section_colors_background: "#ffffff",
      custom_section_gradient_background: "",
    },
  };

  // ═══════════════════════════════════════════════════════════════════
  // COMPARISON TABLE
  // ═══════════════════════════════════════════════════════════════════
  const comparisonId = blockId("comparison_table");
  const compRowIds = content.comparisonTable.benefits.map(() => blockId("row"));
  const comparisonBlocks = Object.fromEntries(
    compRowIds.map((id, i) => [
      id,
      {
        type: "row",
        settings: {
          benefit: `<strong>${escapeHtml(content.comparisonTable.benefits[i] || "Benefit")}</strong>`,
          us: true,
          others: false,
          others_2: false,
          others_3: false,
        },
      },
    ])
  );

  const comparisonTableSection = {
    type: "comparison-table",
    blocks: comparisonBlocks,
    block_order: compRowIds,
    settings: {
      display_id: false,
      visibility: "always-display",
      title: "Comparison table",
      title_highlight_color: "#6d388b",
      heading_size: "h1",
      text: "",
      button_label: "",
      link: "",
      button_style_secondary: false,
      atc_button_label: "",
      atc_product: "",
      atc_skip_cart: false,
      desktop_alignment: "center",
      mobile_alignment: "center",
      color_scheme: "background-1",
      layout: "table_second",
      style: "classic",
      corner_radius: 20,
      number_of_competitors: 1,
      us_label: "[shop_name]",
      us_label_size: 18,
      logo_width: 90,
      mobile_logo_width: 60,
      others_label: "Others",
      others_label_size: 18,
      others_logo_width: 90,
      others_mobile_logo_width: 60,
      others_2_label: "Competitor 2",
      others_2_label_size: 18,
      others_2_logo_width: 90,
      others_2_mobile_logo_width: 60,
      others_3_label: "Competitor 3",
      others_3_label_size: 18,
      others_3_logo_width: 90,
      others_3_mobile_logo_width: 60,
      checkmark_style: "regular",
      checkmark_color: "#53af01",
      checkmark_bg_color: "#53af01",
      x_style: "regular",
      x_color: "#dd1d1d",
      x_bg_color: "#dbdbdb",
      opposite_icon_colors: "original",
      highlighted_color_scheme: "accent-1",
      highlighted_separator_opacity: 0,
      highlighted_overlay_opacity: 0,
      other_cells_color_scheme: "background-1",
      regular_separator_opacity: 10,
      regular_overlay_opacity: 0,
      minimalistic_border_opacity: 16,
      padding_top: 36,
      padding_bottom: 36,
      custom_colors_background: "#ffffff",
      custom_gradient_background: "",
      custom_colors_text: "#2e2a39",
      custom_colors_solid_button_background: "#dd1d1d",
      custom_colors_solid_button_text: "#ffffff",
      custom_colors_outline_button: "#dd1d1d",
      custom_colors_highlighted_background: "#2e2a39",
      custom_colors_highlighted_text: "#ffffff",
      custom_colors_others_background: "#ffffff",
      custom_colors_others_text: "#2e2a39",
    },
  };

  // ═══════════════════════════════════════════════════════════════════
  // IMAGE WITH TEXT 2
  // ═══════════════════════════════════════════════════════════════════
  const iwt2Id = blockId("image_with_text");
  const iwt2HeadingId = blockId("iwt2_heading");
  const iwt2TextId = blockId("iwt2_text");

  const iwt2 = content.imageWithText[1] || content.imageWithText[0];

  const imageWithText2Section = {
    type: "image-with-text",
    blocks: {
      [iwt2HeadingId]: {
        type: "heading",
        settings: {
          title: escapeHtml(iwt2?.heading || "Image with text"),
          title_highlight_color: "#6d388b",
          heading_size: "h2",
        },
      },
      [iwt2TextId]: {
        type: "text",
        settings: {
          text: richtext(escapeHtml(iwt2?.body || "Pair text with an image to focus on your chosen product, collection, or blog post. Add details on availability, style, or even provide a review.")),
          text_style: "body",
        },
      },
    },
    block_order: [iwt2HeadingId, iwt2TextId],
    settings: {
      display_id: false,
      visibility: "always-display",
      video_autoplay: true,
      video_loop: true,
      height: "adapt",
      color_scheme: "background-1",
      section_color_scheme: "background-1",
      full_desktop_width: false,
      content_layout: "no-overlap",
      desktop_media_width: 50,
      layout: "image_first",
      desktop_content_position: "middle",
      desktop_content_alignment: "center",
      mobile_full_media_width: false,
      mobile_direction: "normal",
      mobile_image_quanlity: "2",
      mobile_content_alignment: "center",
      mobile_padding_top: 0,
      mobile_padding_bottom: 16,
      desktop_padding_top: 36,
      desktop_padding_bottom: 36,
      custom_colors_background: "#2e2a39",
      custom_gradient_background: "",
      custom_colors_text: "#ffffff",
      custom_colors_solid_button_background: "#dd1d1d",
      custom_colors_solid_button_text: "#ffffff",
      custom_colors_outline_button: "#dd1d1d",
      custom_section_colors_background: "#ffffff",
      custom_section_gradient_background: "",
    },
  };

  // ═══════════════════════════════════════════════════════════════════
  // TRUSTPILOT REVIEWS
  // ═══════════════════════════════════════════════════════════════════
  const trustpilotReviewsId = blockId("trustpilot_reviews");
  const reviews = content.reviews.length > 0
    ? content.reviews.slice(0, 3)
    : [
        { author: "Author", text: "Share positive thoughts and feedback from your customer..", title: "Heading" },
        { author: "Author", text: "Share positive thoughts and feedback from your customer..", title: "Heading" },
        { author: "Author", text: "Share positive thoughts and feedback from your customer..", title: "Heading" },
      ];

  const reviewColumnIds = reviews.map(() => blockId("column"));
  const reviewBlocks = Object.fromEntries(
    reviewColumnIds.map((id, i) => [
      id,
      {
        type: "column",
        settings: {
          star_color: "#00b67a",
          bg_star_color: "#c8c8c8",
          star_symbol_color: "#fff",
          stars_rating: 5,
          title: reviews[i]?.title || "Heading",
          text: richtext(escapeHtml(reviews[i]?.text || "")),
          author: `<em><strong>${escapeHtml(reviews[i]?.author || "Author")}</strong></em>`,
        },
      },
    ])
  );

  const trustpilotReviewsSection = {
    type: "trustpilot-reviews",
    blocks: reviewBlocks,
    block_order: reviewColumnIds,
    name: "Trustpilot reviews",
    settings: {
      display_id: false,
      visibility: "always-display",
      color_scheme: "background-1",
      desktop_content_position: "above",
      desktop_content_alignment: "center",
      title: "Trustpilot reviews",
      title_highlight_color: "#6D388B",
      heading_size: "h1",
      subtitle: "Excellent [rating] <strong>/ 5</strong> [rating_stars]",
      subheading_rating_text: "<strong>4.8</strong>",
      subheading_mobile_text_size: 18,
      subheading_desktop_text_size: 20,
      subheading_font: "body",
      star_color: "#00b67a",
      bg_star_color: "#c8c8c8",
      star_symbol_color: "#fff",
      stars_rating: 5,
      text: "",
      cards_border_radius: 16,
      card_alignment: "center",
      show_stars: true,
      cards_color_scheme: "background-2",
      type: "slide",
      autoplay: false,
      autoplay_speed: 5,
      arrows_color_scheme: "inverse",
      transparent_arrows: true,
      dots_color_scheme: "inverse",
      desktop_full_page: false,
      columns_desktop: 3,
      slider_desktop: false,
      per_move_desktop: 1,
      desktop_spacing: 24,
      desktop_side_padding: 0,
      desktop_padding_calc: true,
      desktop_adaptive_height: false,
      desktop_dots_position: "under",
      desktop_arrows_position: "sides",
      slider_mobile: true,
      enable_mobile_preview: false,
      mobile_adaptive_height: false,
      mobile_dots_position: "under",
      mobile_arrows_position: "under",
      padding_top: 36,
      padding_bottom: 36,
      custom_colors_background: "#FFFFFF",
      custom_gradient_background: "",
      custom_colors_text: "#2E2A39",
      custom_cards_colors_background: "#F3F3F3",
      custom_cards_gradient_background: "",
      custom_cards_colors_text: "#2E2A39",
    },
  };

  // ═══════════════════════════════════════════════════════════════════
  // SECTION DIVIDER
  // ═══════════════════════════════════════════════════════════════════
  const dividerId = blockId("section_divider");
  const sectionDivider = {
    type: "section-divider",
    settings: {
      visibility: "always-display",
      shape: "waves_3",
      flip_horizontal: false,
      flip_vertical: false,
      shape_color: "accent-1",
      custom_shape_color: "#dd1d1d",
      background_color: "background-1",
      custom_background_color: "#ffffff",
      padding_top: 0,
      padding_bottom: 0,
    },
  };

  // ═══════════════════════════════════════════════════════════════════
  // RELATED PRODUCTS (disabled)
  // ═══════════════════════════════════════════════════════════════════
  const relatedProducts = {
    type: "related-products",
    disabled: true,
    settings: {
      display_id: false,
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

  // ═══════════════════════════════════════════════════════════════════
  // ASSEMBLE TEMPLATE
  // Order: main → related-products → image_with_text_1 → custom_columns →
  //        multirow → comparison_table → image_with_text_2 →
  //        trustpilot_reviews → section_divider
  // ═══════════════════════════════════════════════════════════════════

  const sections: Record<string, object> = {
    main: {
      type: "main-product",
      blocks: mainProductBlocks,
      block_order: mainProductBlockOrder,
      custom_css: [],
      settings: {
        display_id: false,
        enable_sticky_info: true,
        display_variant_image_first: false,
        disable_prepend: true,
        hide_variants: false,
        variant_image_filtering: "none",
        image_zoom: "none",
        arrows_color_scheme: "inverse",
        transparent_arrows: false,
        dots_color_scheme: "inverse",
        video_player: "play_btn",
        enable_video_looping: false,
        autoplay_videos_pause_btn: false,
        video_sound_btn: false,
        video_timeline: false,
        play_btn_color_scheme: "accent-1",
        sound_btn_color_scheme: "inverse",
        timeline_color: "accent-1",
        media_size: "medium",
        media_position: "left",
        gallery_layout: "thumbnail_slider",
        desktop_thumbnails_count: 5,
        constrain_to_viewport: true,
        media_fit: "contain",
        desktop_arrows_position: "hidden",
        mobile_media_corner_radius: 0,
        mobile_spacing_pixels: 0,
        mobile_arrows_position: "sides",
        mobile_pagination: "dots_overlay",
        mobile_thumbnails: "hide",
        mobile_thumbnails_count: 5,
        mobile_scroll_padding_percentage: 0,
        mobile_scroll_padding_pixels: 14,
        enable_mobile_outher_spacing: false,
        mobile_slides_container_width: 100,
        mobile_slides_inner_width: 100,
        trust_badge_position: "top-right",
        trust_badge_size: "medium",
        mobile_padding_top: 0,
        mobile_padding_bottom: 16,
        desktop_padding_top: 36,
        desktop_padding_bottom: 36,
      },
    },
    "related-products": relatedProducts,
    [iwt1Id]: imageWithText1Section,
    [customColumnsId]: customColumnsSection,
    [multirowId]: multirowSection,
    [comparisonId]: comparisonTableSection,
    [iwt2Id]: imageWithText2Section,
    [trustpilotReviewsId]: trustpilotReviewsSection,
    [dividerId]: sectionDivider,
  };

  const order = [
    "main",
    "related-products",
    iwt1Id,
    customColumnsId,
    multirowId,
    comparisonId,
    iwt2Id,
    trustpilotReviewsId,
    dividerId,
  ];

  return {
    sections,
    order,
  };
}
