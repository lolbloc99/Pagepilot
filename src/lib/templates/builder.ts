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

  // ── Main Product Section ──────────────────────────────────────────
  // Matches EXACTLY the Shrine Pro product.json structure:
  // title → rating_stars → price → variant_picker → quantity_selector →
  // buy_buttons → shipping_checkpoints → sticky_atc → description → reviews → collapsible_tab

  const titleBlockId = blockId("title");
  const ratingStarsId = blockId("rating_stars");
  const priceId = blockId("price");
  const variantPickerId = blockId("variant_picker");
  const quantitySelectorId = blockId("quantity_selector");
  const buyButtonsId = blockId("buy_buttons");
  const shippingCheckpointsId = blockId("shipping_checkpoints");
  const stickyAtcId = blockId("sticky_atc");
  const descriptionId = blockId("description");
  const reviewsBlockId = blockId("reviews");

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
        rating: 4.4,
        star_color: "#ffcc00",
        bg_stars_style: "full",
        bg_star_color: "#ececec",
        label: `(${content.reviewCount} Reviews)`,
        size: 16,
        alignment: "flex-start",
        scroll_id: "",
        margin_top: 0,
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
        margin_bottom: 15,
      },
    },
    [variantPickerId]: {
      type: "variant_picker",
      settings: {
        picker_types: "pills, dropdown, dropdown",
        custom_labels: "[name] - [selected]",
        swatches_size: "medium",
        swatches_custom_colors: "disabled",
        swatches_custom_colors_list: "#000000, #6D388B, #0000FF, #FFCC00",
        full_width_dropdowns: false,
        breaks_style: "normal",
        breaks_headline: "BUNDLE & SAVE",
        breaks_color_scheme: "accent-1",
        breaks_badges: "[empty], Most popular, [empty]",
        breaks_displayed_images: "variant_images",
        breaks_custom_images: "",
        breaks_image_width: 70,
        breaks_space_images: true,
        breaks_labels: "[name], [name], [name]",
        breaks_benefits: "[empty], Free Shipping, Free Shipping",
        breaks_captions: "Variant 1 caption, Variant 2 caption, Variant 3 caption",
        breaks_price_texts: "[price], [price], [price]",
        breaks_compare_price_texts: "[compare_price], [compare_price], [compare_price]",
        margin_top: 15,
        margin_bottom: 15,
      },
    },
    [quantitySelectorId]: {
      type: "quantity_selector",
      settings: {
        full_width_classic: false,
        enable_quantity_discounts: false,
        style: "normal",
        headline: "BUNDLE & SAVE",
        preselected: "option_1",
        color_scheme: "accent-1",
        enable_variant_selectors: true,
        enable_variant_selectors_on_quantity_of_1: false,
        update_prices: false,
        hide_pickers_overlay: true,
        pickers_label: "",
        image_width: 70,
        space_images: true,
        option_1_quantity: 1,
        option_1_badge: "",
        option_1_label: "Buy [quantity]",
        option_1_benefit: "",
        option_1_caption: "You save [amount_saved]",
        option_1_percentage_off_text: "0",
        option_1_fixed_amount_off: "0",
        option_1_price_text: "[price]",
        option_1_compare_price: "compare_price",
        option_1_compare_price_text: "[compare_price]",
        option_2_quantity: 2,
        option_2_badge: "",
        option_2_label: "Buy [quantity]",
        option_2_benefit: "",
        option_2_caption: "You save [amount_saved]",
        option_2_percentage_off_text: "0",
        option_2_fixed_amount_off: "0",
        option_2_price_text: "[price]",
        option_2_compare_price: "compare_price",
        option_2_compare_price_text: "[compare_price]",
        option_3_quantity: 3,
        option_3_badge: "",
        option_3_label: "Buy [quantity]",
        option_3_benefit: "",
        option_3_caption: "You save [amount_saved]",
        option_3_percentage_off_text: "0",
        option_3_fixed_amount_off: "0",
        option_3_price_text: "[price]",
        option_3_compare_price: "compare_price",
        option_3_compare_price_text: "[compare_price]",
        option_4_quantity: 4,
        option_4_badge: "",
        option_4_label: "Buy [quantity]",
        option_4_benefit: "",
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
        skip_cart: false,
        uppercase_text: true,
        icon_scale: 120,
        icon_spacing: 10,
        display_price: false,
        enable_custom_color: false,
        custom_color: "#53af01",
        enable_secondary_btn: false,
        secondary_btn_label: "Buy It Now",
        secondary_btn_enable_custom_color: false,
        secondary_btn_custom_color: "#dd1d1d",
        margin_top: 24,
        margin_bottom: 24,
      },
    },
    [shippingCheckpointsId]: {
      type: "shipping_checkpoints",
      settings: {
        icon_1: "add_shopping_cart",
        filled_icon_1: false,
        top_text_1: "<strong>[start_date]</strong>",
        bottom_text_1: "Ordered",
        min_days_1: 0,
        max_days_1: 0,
        icon_2: "local_shipping",
        filled_icon_2: false,
        top_text_2: "<strong>[start_date] - [end_date]</strong>",
        bottom_text_2: "Order Ready",
        min_days_2: 1,
        max_days_2: 2,
        icon_3: "redeem",
        filled_icon_3: false,
        top_text_3: "<strong>[start_date] - [end_date]</strong>",
        bottom_text_3: "Delivered",
        min_days_3: 10,
        max_days_3: 12,
        icon_4: "",
        filled_icon_4: false,
        top_text_4: "",
        bottom_text_4: "",
        date_format: "mm_dd",
        days_labels: "Mon, Tue, Wed, Thu, Fri, Sat, Sun",
        months_labels: "Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec",
        color_scheme: "inverse",
        margin_top: 24,
        margin_bottom: 24,
      },
    },
    [stickyAtcId]: {
      type: "sticky_atc",
      settings: {
        function: "add_to_cart",
        display_when: "after_scroll",
        button_label: "Add to cart",
        enable_custom_btn_color: false,
        custom_btn_color: "#dd1d1d",
        color_scheme: "background-1",
        star_color: "#ffcc00",
        stars_label: `(${content.reviewCount} Reviews)`,
        picker_type: "combined",
        desktop_show_image: true,
        desktop_show_title: true,
        desktop_rating_stars: false,
        desktop_show_price: true,
        desktop_show_sale_badge: true,
        desktop_variant_picker: true,
        desktop_full_button_width: false,
        desktop_show_price_in_button: false,
        desktop_transparent_bg: false,
        mobile_show_image: false,
        mobile_show_title: true,
        mobile_rating_stars: false,
        mobile_show_price: true,
        mobile_show_sale_badge: false,
        mobile_variant_picker: false,
        mobile_full_button_width: false,
        mobile_show_price_in_button: false,
        mobile_transparent_bg: false,
      },
    },
    [descriptionId]: {
      type: "description",
      settings: {
        margin_top: 24,
        margin_bottom: 24,
      },
    },
    [reviewsBlockId]: {
      type: "reviews",
      settings: {
        color_scheme: "background-1",
        show_custom_bg: false,
        custom_bg_color: "#f2f2f2",
        corner_radius: 12,
        border_width: 0,
        border_color: "#b7b7b7",
        avatar_alignment: "top",
        avatar_corner_radius: 40,
        star_color: "#ffcc00",
        stars_translate: 0,
        checkmark_color: "#6d388b",
        checkmark_icon_color: "#ffffff",
        slider_type: "slide",
        autoplay: false,
        autoplay_speed: 5,
        display_arrows: false,
        display_dots: true,
        author_1: content.reviews[0]
          ? `<em>${escapeHtml(content.reviews[0].author)}</em> [stars]`
          : "<em>Author</em> [stars]",
        text_1: content.reviews[0]
          ? richtext(escapeHtml(content.reviews[0].text))
          : "<p>Share positive thoughts and feedback from your customer.</p>",
        author_2: content.reviews[1]
          ? `<em>${escapeHtml(content.reviews[1].author)}</em> [stars]`
          : "<em>Author</em> [stars]",
        text_2: content.reviews[1]
          ? richtext(escapeHtml(content.reviews[1].text))
          : "<p>Share positive thoughts and feedback from your customer.</p>",
        author_3: content.reviews[2]
          ? `<em>${escapeHtml(content.reviews[2].author)}</em> [stars]`
          : "<em>Author</em> [stars]",
        text_3: content.reviews[2]
          ? richtext(escapeHtml(content.reviews[2].text))
          : "<p>Share positive thoughts and feedback from your customer.</p>",
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
            heading: content.collapsibleTabs[i].heading,
            heading_size: "medium",
            icon: content.collapsibleTabs[i].icon || "check_box",
            filled_icon: false,
            collapse_icon: "carret",
            display_top_border: true,
            open: false,
            content: richtext(content.collapsibleTabs[i].content),
            page: "",
            margin_top: 24,
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
    variantPickerId,
    quantitySelectorId,
    buyButtonsId,
    shippingCheckpointsId,
    stickyAtcId,
    descriptionId,
    reviewsBlockId,
    ...collapsibleTabIds,
  ];

  // ── Custom Columns Section ──────────────────────────────────────────
  const customColumnsId = blockId("custom_columns");
  const ccBlocks: Record<string, object> = {};
  const ccBlockOrder: string[] = [];

  // Heading block (full width col_1)
  const ccHeadingId = blockId("cc_heading");
  ccBlocks[ccHeadingId] = {
    type: "heading",
    settings: {
      column: "col_1",
      visibility: "always-display",
      heading: content.title || "Custom columns",
      title_highlight_color: "#6d388b",
      heading_size: "h1",
      alignment: "center",
      mobile_alignment: "mobile-center",
      margin_top: 20,
      margin_bottom: 20,
    },
  };
  ccBlockOrder.push(ccHeadingId);

  // Richtext block (full width col_1)
  const ccRichtextId = blockId("cc_richtext");
  ccBlocks[ccRichtextId] = {
    type: "richtext",
    settings: {
      column: "col_1",
      visibility: "always-display",
      text: richtext(escapeHtml(content.subtitle)),
      text_style: "body",
      alignment: "center",
      mobile_alignment: "mobile-center",
      margin_top: 20,
      margin_bottom: 20,
    },
  };
  ccBlockOrder.push(ccRichtextId);

  // Features as icon_with_text blocks in col_2 and col_4
  const features = content.customColumnFeatures.length > 0
    ? content.customColumnFeatures
    : content.iconFeatures.map((f) => ({ title: f.heading, text: f.heading }));

  const half = Math.ceil(features.length / 2);
  const leftFeatures = features.slice(0, half);
  const rightFeatures = features.slice(half);

  leftFeatures.forEach((f, i) => {
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
        margin_top: 20,
        margin_bottom: i === leftFeatures.length - 1 ? 20 : 30,
      },
    };
    ccBlockOrder.push(id);
  });

  // Image placeholder in col_3
  const ccImageId = blockId("cc_image");
  ccBlocks[ccImageId] = {
    type: "image",
    settings: {
      column: "col_3",
      visibility: "always-display",
      width: 100,
      alignment: "center",
      mobile_alignment: "center",
      border_radius: 0,
      margin_top: 20,
      margin_bottom: 20,
    },
  };
  ccBlockOrder.push(ccImageId);

  rightFeatures.forEach((f, i) => {
    const id = blockId("cc_icon");
    ccBlocks[id] = {
      type: "icon_with_text",
      settings: {
        column: "col_4",
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
        margin_top: 20,
        margin_bottom: i === rightFeatures.length - 1 ? 20 : 30,
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
      padding_top: 36,
      padding_bottom: 36,
      custom_colors_background: "#ffffff",
      custom_gradient_background: "",
      custom_colors_text: "#2e2a39",
      custom_colors_solid_button_background: "#dd1d1d",
      custom_colors_solid_button_text: "#ffffff",
      custom_colors_outline_button: "#dd1d1d",
    },
  };

  // ── Image Slider Section ──────────────────────────────────────────
  const imageSliderId = blockId("image_slider");
  const slideIds = [1, 2, 3, 4].map(() => blockId("slide"));
  const imageSliderBlocks = Object.fromEntries(
    slideIds.map((id) => [
      id,
      {
        type: "image_slide",
        settings: {
          link: "",
          description: "",
          desc_alignment: "center",
          desc_color_scheme: "background-2",
        },
      },
    ])
  );

  const imageSliderSection = {
    type: "image-slider",
    blocks: imageSliderBlocks,
    block_order: slideIds,
    settings: {
      display_id: false,
      visibility: "always-display",
      title: "Image/Video Slider",
      title_highlight_color: "#6d388b",
      heading_size: "h1",
      color_scheme: "background-1",
      type: "slide",
      drag: "enabled",
      autoplay: false,
      autoplay_speed: 5,
      center_mode: false,
      arrows_color_scheme: "inverse",
      transparent_arrows: false,
      dots_color_scheme: "inverse",
      desktop_full_page: false,
      desktop_border_radius: 0,
      slides_desktop: 3,
      per_move_desktop: 1,
      desktop_spacing: 28,
      desktop_side_padding: 0,
      desktop_padding_calc: true,
      desktop_adaptive_height: false,
      desktop_dots_position: "under",
      desktop_arrows_position: "sides",
      mobile_full_page: false,
      mobile_border_radius: 0,
      slides_mobile: 2,
      per_move_mobile: 1,
      mobile_spacing: 12,
      mobile_side_padding: 0,
      mobile_padding_calc: true,
      mobile_adaptive_height: false,
      mobile_dots_position: "under",
      mobile_arrows_position: "sides",
      padding_top: 36,
      padding_bottom: 36,
      custom_colors_background: "#ffffff",
      custom_gradient_background: "",
      custom_colors_text: "#121212",
    },
  };

  // ── Icons With Content Section ──────────────────────────────────────
  const iconsContentId = blockId("icons_content");
  const iconBlocks: Record<string, object> = {};
  const iconBlockOrder: string[] = [];

  // Icon blocks
  const iconFeatures = content.customColumnFeatures.length > 0
    ? content.customColumnFeatures.slice(0, 3)
    : content.iconFeatures.slice(0, 3).map((f) => ({ title: f.heading, text: f.heading }));

  iconFeatures.forEach((f) => {
    const id = blockId("icon");
    iconBlocks[id] = {
      type: "icon",
      settings: {
        icon: "check_circle",
        filled_icon: false,
        title: escapeHtml(f.title),
        text: richtext(escapeHtml(f.text || "")),
      },
    };
    iconBlockOrder.push(id);
  });

  // Heading block
  const iconsHeadingId = blockId("icons_heading");
  iconBlocks[iconsHeadingId] = {
    type: "heading",
    settings: {
      title: escapeHtml(content.title || "Content heading"),
      title_highlight_color: "#6d388b",
      heading_size: "h1",
    },
  };
  iconBlockOrder.push(iconsHeadingId);

  // Text block
  const iconsTextId = blockId("icons_text");
  iconBlocks[iconsTextId] = {
    type: "text",
    settings: {
      text: richtext(escapeHtml(content.subtitle)),
      text_style: "body",
    },
  };
  iconBlockOrder.push(iconsTextId);

  // Button block
  const iconsButtonId = blockId("icons_button");
  iconBlocks[iconsButtonId] = {
    type: "button",
    settings: {
      button_label: "Button label",
      button_link: "",
      button_style_secondary: false,
    },
  };
  iconBlockOrder.push(iconsButtonId);

  const iconsWithContentSection = {
    type: "icons-with-content",
    blocks: iconBlocks,
    block_order: iconBlockOrder,
    settings: {
      display_id: false,
      visibility: "always-display",
      color_scheme: "background-1",
      icon_size: "m",
      icon_position: "next-to-title",
      icon_color: "accent-1",
      icon_heading_size: "h3",
      icon_text_alignment: "left",
      icons_desktop_layout: "1-column",
      icons_mobile_layout: "1-column",
      desktop_content_alignment: "left",
      layout: "image_first",
      mobile_layout: "text_first",
      hide_content_on_mobile: false,
      padding_top: 36,
      padding_bottom: 36,
      custom_colors_background: "#ffffff",
      custom_gradient_background: "",
      custom_colors_text: "#2e2a39",
      custom_colors_solid_button_background: "#dd1d1d",
      custom_colors_solid_button_text: "#ffffff",
      custom_colors_outline_button: "#dd1d1d",
    },
  };

  // ── Testimonials Section ──────────────────────────────────────────
  const testimonialsId = blockId("testimonials");
  const testimonialReviews = content.reviews.length > 0
    ? content.reviews.slice(0, 3)
    : [
        { author: "Author", text: "Share positive thoughts and feedback from your customer..", title: "Heading" },
        { author: "Author", text: "Share positive thoughts and feedback from your customer..", title: "Heading" },
        { author: "Author", text: "Share positive thoughts and feedback from your customer..", title: "Heading" },
      ];

  const testimonialColumnIds = testimonialReviews.map(() => blockId("testimonial_col"));
  const testimonialBlocks = Object.fromEntries(
    testimonialColumnIds.map((id, i) => [
      id,
      {
        type: "column",
        settings: {
          title: testimonialReviews[i]?.title || "Heading",
          text: richtext(escapeHtml(testimonialReviews[i]?.text || "")),
          author: `<em><strong>${escapeHtml(testimonialReviews[i]?.author || "Author")}</strong></em>`,
        },
      },
    ])
  );

  const testimonialsSection = {
    type: "testimonials",
    blocks: testimonialBlocks,
    block_order: testimonialColumnIds,
    settings: {
      display_id: false,
      visibility: "always-display",
      title: "Testimonials",
      title_highlight_color: "#6d388b",
      heading_size: "h1",
      text: "",
      color_scheme: "background-1",
      image_width: "full",
      image_ratio: "square",
      column_alignment: "center",
      show_stars: true,
      stars_color: "#ffd700",
      show_quotes: true,
      quotes_color_scheme: "accent-2",
      cards_color_scheme: "bg-overlay",
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
      desktop_spacing: 40,
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
      custom_colors_background: "#ffffff",
      custom_gradient_background: "",
      custom_colors_text: "#2e2a39",
      custom_cards_colors_background: "#f3f3f3",
      custom_cards_gradient_background: "",
      custom_cards_colors_text: "#2e2a39",
    },
  };

  // ── Section Divider ────────────────────────────────────────────────
  const dividerId = blockId("divider");
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

  // ── Related Products (disabled) ───────────────────────────────────
  const relatedProductsId = "related-products";
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
      columns_mobile: "2",
      padding_top: 36,
      padding_bottom: 24,
    },
  };

  // ── Assemble Template ─────────────────────────────────────────────
  // Exact order from Shrine Pro product.json:
  // main → related-products → custom-columns → image-slider → icons-with-content → testimonials → section-divider

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
    [relatedProductsId]: relatedProducts,
    [customColumnsId]: customColumnsSection,
    [imageSliderId]: imageSliderSection,
    [iconsContentId]: iconsWithContentSection,
    [testimonialsId]: testimonialsSection,
    [dividerId]: sectionDivider,
  };

  const order = [
    "main",
    relatedProductsId,
    customColumnsId,
    imageSliderId,
    iconsContentId,
    testimonialsId,
    dividerId,
  ];

  return {
    sections,
    order,
  };
}
