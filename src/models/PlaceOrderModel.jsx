class PlaceOrder {
  constructor() {
    this.cart = [];
    this.order_amount = 0;
    this.order_type = "";
    this.payment_method = "";
    this.payment_by = "";
    this.payment_note = "";
    this.payment_info = {};
    this.time_slot_id = 0;
    this.delivery_address_id = 0;
    this.branch_id = 0;
    this.address = {};
    this.distance = 0;
    this.transaction_reference = "";
    this.coupon_code = "";
    this.is_partial = false;
    this.coupon_discount_amount = 0;
    this.coupon_discount_title = "";
  }

  setOrderPlace(getOrder) {
    this.cart = getOrder.cart;
    this.order_amount = getOrder.amount;
    this.order_type = getOrder.order_type;
    this.branch_id = getOrder.branch_id;
    this.payment_method = getOrder.payment_method;
    this.time_slot_id = getOrder.time_slot_id;
    this.payment_by = getOrder.payment_by;
    this.payment_note = getOrder.payment_note;
    this.payment_info = getOrder.payment_info;
    this.payment_by = getOrder.address;
    this.distance = getOrder.distance;
    this.transaction_reference = getOrder.transaction_reference;
    this.coupon_code = getOrder.coupon_code;
    this.is_partial = getOrder.is_partial;
    this.coupon_discount_amount = getOrder.coupon_discount_amount;
    this.coupon_discount_title = getOrder.coupon_title;
  }

  getOrderPlace() {
    return {
      cart: this.cart,
      order_amount: this.order_amount,
      order_type: this.order_type,
      branch_id: this.branch_id,
      time_slot_id: this.time_slot_id,
      payment_method: this.payment_method,
      payment_by: this.payment_by,
      payment_info: this.payment_info,
      payment_note: this.payment_note,
      distance: this.distance,
      transaction_reference: this.transaction_reference,
      coupon_code: this.coupon_code,
      is_partial: this.is_partial,
      coupon_discount_amount: this.coupon_discount_amount,
      coupon_discount_title: this.coupon_discount_title,
    };
  }
}

export default PlaceOrder;
