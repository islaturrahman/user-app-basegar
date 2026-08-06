export class ProductModel {
    constructor()  {
        this.products = [];
        this.product_details = [];
        this.categories = [];
        this.variant = '';
        this.variations = [];
        this.price = 0;
        this.name = 0;
        this.image = '';
        this.product_choice = {
            title: '',
            price: 0,
            quantity: 0
        };
    }

    
    getProducts() {
        return this.products;
    }

    setProducts(products) {
        this.products = products;
    }

    getCategories(){
        return this.categories;
    }

    setCategories(categories){
        this.categories = categories;
    }
}