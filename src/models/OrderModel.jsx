class OrderModel {
  constructor() {
    this.orders = [];
  }

  createOrder(order) {
    this.orders.push(order);
    return order;
  }

  getOrders() {
    return this.orders;
  }
}

export class Cart {
  constructor() {
    this.product_id = "";
    this.name = "";
    this.price = 0;
    this.quantity = 0;
    this.variant = [];
    this.variation = [];
    this.tax_total = 0;
    this.image = "";
    this.stock_schedule = {
      status: false,
      date: null,
      tomorrow: true,
    };
    this.time_slot = null;
  }

  setVariant(variant) {
    this.variant = variant;
  }

  getVariant() {
    return this.variant;
  }

  setVariations(variation) {
    this.variation = variation;
  }

  getVariations() {
    return this.variation;
  }

  getCart() {
    return {
      product_id: this.product_id,
      name: this.name,
      price: this.price,
      quantity: this.quantity,
      variant: this.variant,
      variation: this.variation,
      tax_total: this.tax_total,
      image: this.image,
      tomorrow: this.tomorrow,
      stock_schedule: this.stock_schedule,
      time_slot: this.time_slot,
    };
  }
}
