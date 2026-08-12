// export const base_url = "http://192.168.11.161:8000"; // Menggunakan IP lokal agar bisa diakses dari emulator/device
export const base_url = "https://dashboard.basegar.com";

export const flash_deal = "/api/v1/flash-deals";
export const banners = "/api/v1/banners";
export const users = "/api/v1/users";

//products
export const all_products = "/api/v1/products/all";
export const product_details = "/api/v1/products/details";
export const get_search_products = "/api/v1/products/search";
export const get_popular_products = "/api/v1/products/popular";
export const get_most_reviewed_products = "/api/v1/products/most-reviewed";
export const get_featured_products = "/api/v1/products/featured";
export const get_trending_products = "/api/v1/products/trending";

//categories
export const category = "/api/v1/categories";
export const category_childs = "/api/v1/categories/childes";
export const category_products_all = "/api/v1/categories/products";

// config
export const app_init = "/api/v1/app/init";
export const config_url = "/api/v1/config";
export const delivery_fee = "/api/v1/config/delivery-fee";

//maps
export const search_address_autocomplete =
  "/api/v1/mapapi/place-api-autocomplete";
export const place_api_details = "/api/v1/mapapi/place-api-details";
export const get_map = "/api/v1/mapapi/map";

//storage
export const productImgPath = "/storage/app/public/product";

// login
export const login = "/api/v1/auth/login";
export const check_phone = "/api/v1/auth/check-phone";
export const phone_verify = "/api/v1/auth/verify-phone";
export const firebase_auth = "/api/v1/auth/firebase-auth";

// registration
export const registration = "/api/v1/auth/register";

//customer
export const customerInfo = "/api/v1/customer/info";

//address
export const address = "/api/v1/customer/address";
export const addressList = "/api/v1/customer/address/list";
export const add_address = "/api/v1/customer/address/add";

// customer order
export const last_ordered_address = "/api/v1/customer/last-ordered-address";
export const orderList = "/api/v1/customer/order/list";
export const orderDetail = "/api/v1/customer/order/details";
export const place_order = "/api/v1/customer/order/place";
export const dana_charge = "/api/v1/payment/dana/charge";

//timeslot
export const time_slot = "/api/v1/timeSlot";

// cs message
export const get_admin_message = "/api/v1/customer/message/get-admin-message";
export const send_admin_message = "/api/v1/customer/message/send-admin-message";

//image
export const path_product_img = `${base_url}/storage/product`;
export const path_delivery_man_img = `${base_url}/storage/delivery-man`;
export const path_category_img = `${base_url}/storage/category`;
export const path_category_banner_img = `${base_url}/storage/category/banner`;
export const path_banner_img = `${base_url}/storage/banner`;
export const path_offer_img = `${base_url}/storage/offer`;
