class ConfigModel {
  constructor() {
    this.ecommerce_name = "";
    this.ecommerce_logo = "";
    this.ecommerce_address = "";
    this.ecommerce_phone = "";
    this.ecommerce_email = "";
    this.ecommerce_location_coverage = {
      longitude: "",
      latitude: "",
      coverage: 0,
    };
    this.minimum_order_value = 0;
    this.self_pickup = 0;
    this.base_urls = {
      product_image_url: "",
      customer_image_url: "",
      banner_image_url: "",
      category_image_url: "",
      review_image_url: "",
      notification_image_url: "",
      ecommerce_image_url: "",
      delivery_man_image_url: "",
      chat_image_url: "",
      flash_sale_image_url: "",
      gateway_image_url: "",
      payment_image_url: "",
    };
    this.currency_symbol = "";
    this.delivery_charge = 0;
    this.delivery_management = {
      status: 0,
      min_shipping_charge: 0,
      shipping_per_km: 0,
      partial_max_free_delivery: 0,
    };
    this.branches = [];
    this.terms_and_conditions = "";
    this.privacy_policy = "";
    this.about_us = "";
    this.faq = "";
    this.email_verification = false;
    this.phone_verification = false;
    this.currency_symbol_position = "";
    this.maintenance_mode = false;
    this.country = "";
    this.play_store_config = {
      status: false,
      link: "",
      min_version: "",
    };
    this.app_store_config = {
      status: false,
      link: "",
      min_version: "",
    };
    this.social_media_link = [];
    this.software_version = "";
    this.footer_text = "";
    this.decimal_point_settings = "";
    this.time_format = "";
    this.social_login = {
      google: 0,
      facebook: 0,
    };
    this.wallet_status = 0;
    this.loyalty_point_status = 0;
    this.ref_earning_status = 0;
    this.loyalty_point_exchange_rate = 0;
    this.ref_earning_exchange_rate = 0;
    this.loyalty_point_item_purchase_point = 0;
    this.loyalty_point_minimum_point = 0;
    this.free_delivery_over_amount = 0;
    this.maximum_amount_for_cod_order = 0;
    this.cookies_management = {
      status: 0,
      text: "",
    };
    this.product_vat_tax_status = "";
    this.maximum_amount_for_cod_order_status = 0;
    this.free_delivery_over_amount_status = 0;
    this.cancellation_policy = "";
    this.refund_policy = "";
    this.return_policy = "";
    this.cancellation_policy_status = 0;
    this.refund_policy_status = 0;
    this.return_policy_status = 0;
    this.whatsapp = {
      status: 0,
      number: "",
    };
    this.telegram = {
      status: 0,
      user_name: "",
    };
    this.messenger = {
      status: 0,
      user_name: "",
    };
    this.featured_product_status = 0;
    this.trending_product_status = 0;
    this.most_reviewed_product_status = 0;
    this.recommended_product_status = 0;
    this.flash_deal_product_status = 0;
    this.toggle_dm_registration = 0;
    this.otp_resend_time = 0;
    this.digital_payment_info = {
      digital_payment: "",
      plugin_payment_gateways: "",
      default_payment_gateways: "",
    };
    this.digital_payment_status = 0;
    this.active_payment_method_list = [];
    this.cash_on_delivery = "";
    this.digital_payment = "";
    this.offline_payment = "";
    this.guest_checkout = 0;
    this.partial_payment = 0;
    this.partial_payment_combine_with = "";
    this.add_fund_to_wallet = 0;
    this.apple_login = {
      login_medium: "",
      status: 0,
      client_id: "",
    };
    this.firebase_otp_verification_status = 0;
    this.customer_verification = {
      status: 0,
      type: "",
    };
  }

  setConfig(config) {
    // Top-level assignments
    this.ecommerce_name = config.ecommerce_name || this.ecommerce_name;
    this.ecommerce_logo = config.ecommerce_logo || this.ecommerce_logo;
    this.ecommerce_address = config.ecommerce_address || this.ecommerce_address;
    this.ecommerce_phone = config.ecommerce_phone || this.ecommerce_phone;
    this.ecommerce_email = config.ecommerce_email || this.ecommerce_email;

    // Nested objects: ecommerce_location_coverage
    if (config.ecommerce_location_coverage) {
      this.ecommerce_location_coverage.longitude =
        config.ecommerce_location_coverage.longitude ||
        this.ecommerce_location_coverage.longitude;
      this.ecommerce_location_coverage.latitude =
        config.ecommerce_location_coverage.latitude ||
        this.ecommerce_location_coverage.latitude;
      this.ecommerce_location_coverage.coverage =
        config.ecommerce_location_coverage.coverage ||
        this.ecommerce_location_coverage.coverage;
    }

    // base_urls assignments
    if (config.base_urls) {
      this.base_urls.product_image_url =
        config.base_urls.product_image_url || this.base_urls.product_image_url;
      this.base_urls.customer_image_url =
        config.base_urls.customer_image_url ||
        this.base_urls.customer_image_url;
      this.base_urls.banner_image_url =
        config.base_urls.banner_image_url || this.base_urls.banner_image_url;
      this.base_urls.category_image_url =
        config.base_urls.category_image_url ||
        this.base_urls.category_image_url;
      this.base_urls.review_image_url =
        config.base_urls.review_image_url || this.base_urls.review_image_url;
      this.base_urls.notification_image_url =
        config.base_urls.notification_image_url ||
        this.base_urls.notification_image_url;
      this.base_urls.ecommerce_image_url =
        config.base_urls.ecommerce_image_url ||
        this.base_urls.ecommerce_image_url;
      this.base_urls.delivery_man_image_url =
        config.base_urls.delivery_man_image_url ||
        this.base_urls.delivery_man_image_url;
      this.base_urls.chat_image_url =
        config.base_urls.chat_image_url || this.base_urls.chat_image_url;
      this.base_urls.flash_sale_image_url =
        config.base_urls.flash_sale_image_url ||
        this.base_urls.flash_sale_image_url;
      this.base_urls.gateway_image_url =
        config.base_urls.gateway_image_url || this.base_urls.gateway_image_url;
      this.base_urls.payment_image_url =
        config.base_urls.payment_image_url || this.base_urls.payment_image_url;
    }

    if (config.branches) {
      this.branches = config.branches.map((branch) => branch);
    }

    // delivery_management
    if (config.delivery_management) {
      this.delivery_management.status =
        config.delivery_management.status || this.delivery_management.status;
      this.delivery_management.min_shipping_charge =
        config.delivery_management.min_shipping_charge ||
        this.delivery_management.min_shipping_charge;
      this.delivery_management.shipping_per_km =
        config.delivery_management.shipping_per_km ||
        this.delivery_management.shipping_per_km;
      this.delivery_management.partial_max_free_delivery =
        config.delivery_management.partial_max_free_delivery ||
        this.delivery_management.partial_max_free_delivery;
    }

    // play_store_config
    if (config.play_store_config) {
      this.play_store_config.status =
        config.play_store_config.status || this.play_store_config.status;
      this.play_store_config.link =
        config.play_store_config.link || this.play_store_config.link;
      this.play_store_config.min_version =
        config.play_store_config.min_version ||
        this.play_store_config.min_version;
    }

    // app_store_config
    if (config.app_store_config) {
      this.app_store_config.status =
        config.app_store_config.status || this.app_store_config.status;
      this.app_store_config.link =
        config.app_store_config.link || this.app_store_config.link;
      this.app_store_config.min_version =
        config.app_store_config.min_version ||
        this.app_store_config.min_version;
    }

    // social_login
    if (config.social_login) {
      this.social_login.google =
        config.social_login.google || this.social_login.google;
      this.social_login.facebook =
        config.social_login.facebook || this.social_login.facebook;
    }

    // wallet and loyalty settings
    this.wallet_status = config.wallet_status || this.wallet_status;
    this.loyalty_point_status =
      config.loyalty_point_status || this.loyalty_point_status;
    this.ref_earning_status =
      config.ref_earning_status || this.ref_earning_status;
    this.loyalty_point_exchange_rate =
      config.loyalty_point_exchange_rate || this.loyalty_point_exchange_rate;
    this.ref_earning_exchange_rate =
      config.ref_earning_exchange_rate || this.ref_earning_exchange_rate;
    this.loyalty_point_item_purchase_point =
      config.loyalty_point_item_purchase_point ||
      this.loyalty_point_item_purchase_point;
    this.loyalty_point_minimum_point =
      config.loyalty_point_minimum_point || this.loyalty_point_minimum_point;
    this.free_delivery_over_amount =
      config.free_delivery_over_amount || this.free_delivery_over_amount;
    this.maximum_amount_for_cod_order =
      config.maximum_amount_for_cod_order || this.maximum_amount_for_cod_order;

    // policies
    this.cancellation_policy =
      config.cancellation_policy || this.cancellation_policy;
    this.refund_policy = config.refund_policy || this.refund_policy;
    this.return_policy = config.return_policy || this.return_policy;

    // contact details
    if (config.whatsapp) {
      this.whatsapp.status = config.whatsapp.status || this.whatsapp.status;
      this.whatsapp.number = config.whatsapp.number || this.whatsapp.number;
    }
    if (config.telegram) {
      this.telegram.status = config.telegram.status || this.telegram.status;
      this.telegram.user_name =
        config.telegram.user_name || this.telegram.user_name;
    }
    if (config.messenger) {
      this.messenger.status = config.messenger.status || this.messenger.status;
      this.messenger.user_name =
        config.messenger.user_name || this.messenger.user_name;
    }

    // feature settings
    this.featured_product_status =
      config.featured_product_status || this.featured_product_status;
    this.trending_product_status =
      config.trending_product_status || this.trending_product_status;
    this.most_reviewed_product_status =
      config.most_reviewed_product_status || this.most_reviewed_product_status;
    this.recommended_product_status =
      config.recommended_product_status || this.recommended_product_status;
    this.flash_deal_product_status =
      config.flash_deal_product_status || this.flash_deal_product_status;

    // Other configurations like payment, OTP, etc.
    if (config.digital_payment_info) {
      this.digital_payment_info.digital_payment =
        config.digital_payment_info.digital_payment ||
        this.digital_payment_info.digital_payment;
      this.digital_payment_info.plugin_payment_gateways =
        config.digital_payment_info.plugin_payment_gateways ||
        this.digital_payment_info.plugin_payment_gateways;
      this.digital_payment_info.default_payment_gateways =
        config.digital_payment_info.default_payment_gateways ||
        this.digital_payment_info.default_payment_gateways;
    }
    this.digital_payment_status =
      config.digital_payment_status || this.digital_payment_status;
    this.active_payment_method_list =
      config.active_payment_method_list || this.active_payment_method_list;
    this.cash_on_delivery = config.cash_on_delivery || this.cash_on_delivery;
    this.digital_payment = config.digital_payment || this.digital_payment;
    this.offline_payment = config.offline_payment || this.offline_payment;
    this.guest_checkout = config.guest_checkout || this.guest_checkout;
    this.partial_payment = config.partial_payment;
    this.partial_payment_combine_with = config.partial_payment_combine_with;
    this.add_fund_to_wallet = config.add_fund_to_wallet;
    this.firebase_otp_verification_status =
      config.firebase_otp_verification_status;

    if (config.customer_verification) {
      this.customer_verification.status = config.customer_verification.status;
      this.customer_verification.type = config.customer_verification.type;
    }

    if (config.apple_login) {
      this.apple_login.login_medium = config.apple_login.login_medium;
      this.app_store_config.status = config.apple_login.status;
      this.apple_login.client_id = config.apple_login.client_id;
    }
  }
}

export default ConfigModel;
