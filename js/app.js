// vars
const cartBtn = document.querySelector('.cart-btn');
const closeCartBtn = document.querySelector('.close-cart');
const clearCartBtn = document.querySelector('.clear-cart');
const cartDOM = document.querySelector('.cart');
const cartOverlay = document.querySelector('.cart-overlay');
const cartNavItems = document.querySelector('.cart-items');
const cartTotals = document.querySelector('.cart-total');
const cartContent = document.querySelector('.cart-content');

const productsDOM = document.querySelector('.products-center');

// main cart items
let cart = [];
// buttons
let buttonsDOM = [];

// classes
class Products {
  async getProducts() {
    try {
      let result = await fetch('../products.json');
      result = await result.json();
      // clean up returned json
      let products = result.items;
      products = products.map((item) => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return { title, price, id, image };
      });

      console.log(products);

      return products;
    } catch (error) {
      console.log(error);
    }
  }
}
// display products
class UI {
  displayProducts(products) {
    console.log(`Products:`);
    console.log(products);
    let result = '';
    products.forEach((product) => {
      result += `
      <article class="product">
        <div class="img-container">
          <img src="${product.image}" alt="product" class="product-img">
          <button class="bag-btn" data-id="${product.id}">
            <i class="fas fa-shopping-cart"></i>
            add to bag
          </button>
        </div>
        <h3>${product.title}</h3>
        <h4>$${product.price}</h4>
      </article>
      `;
    });
    productsDOM.innerHTML = result;
  }

  getBagButtons() {
    // spread operator "..." - convert nodelist -> array
    const buttons = [...document.querySelectorAll('.bag-btn')];
    buttonsDOM = buttons;
    console.log(buttonsDOM);

    buttons.forEach((button) => {
      // if in cart, disable item button
      let id = button.getAttribute('data-id');
      let inCart = cart.find((item) => item.id === id);
      if (inCart) {
        button.innerText = 'In Cart';
        button.disabled = true;
      } else {
        // make button event
        button.addEventListener('click', (event) => {
          event.target.innerText = 'In Cart';
          event.target.disabled = true;
          // get product from products local stroage
          let cartItem = Storage.getProduct(id);
          cartItem.amount = 1;
          // add product to the cart
          // cart = [...cart, cartItem];
          cart.push(cartItem);
          // save cart in local storage
          Storage.saveCart(cart);
          // set cart values
          this.setCartValues(cart);
          // display cart item
          console.log(cartItem);
          this.addCartItem(cartItem);
          // show the cart
          this.showCart();
        });
      }
    });
  }

  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.map((item) => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    cartTotals.innerText = parseFloat(tempTotal.toFixed(2));
    cartNavItems.innerText = itemsTotal;
    // console.log(cartTotals);
  }

  addCartItem(item) {
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
    <img src="${item.image}" alt="product">
    <div>
      <h4>${item.title}</h4>
      <h5>${item.price}</h5>
      <span class="remove-item" data-id=${item.id}>remove</span>
    </div>
    <div>
      <i class="fas fa-chevron-up" data-id=${item.id}></i>
      <p class="item-amount">${item.amount}</p>
      <i class="fas fa-chevron-down" data-id=${item.id}></i>
    </div>
    `;
    cartContent.appendChild(div);
    // console.log(cartContent);
  }

  removeCartItem(id) {
    cart = cart.filter((item) => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    console.log(button);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to bag`;
  }

  getSingleButton(id) {
    return buttonsDOM.find((button) => button.dataset.id === id);
  }

  showCart() {
    cartOverlay.classList.add('transparentBcg');
    cartDOM.classList.add('showcart');
  }

  hideCart() {
    cartOverlay.classList.remove('transparentBcg');
    cartDOM.classList.remove('showcart');
  }

  clearCart() {
    console.log(this);
    let cartItems = cart.map((item) => item.id);
    cartItems.forEach((id) => this.removeCartItem(id));

    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }

    this.hideCart();
  }

  populateCart(cart) {
    cart.forEach((item) => {
      this.addCartItem(item);
    });
  }

  setupAPP() {
    // Load cart from local Storage
    cart = Storage.loadCart();
    this.setCartValues(cart);
    this.populateCart(cart);

    // event listeners (open and close cart)
    cartBtn.addEventListener('click', this.showCart);
    closeCartBtn.addEventListener('click', this.hideCart);
  }

  cartLogic() {
    clearCartBtn.addEventListener('click', () => {
      // extra arrow function needed so this refers to UI ojbect instead of btn object
      this.clearCart();
    });
    // cart functionality (incrase qty, remove item) using "event bubbling"
    cartContent.addEventListener('click', (event) => {
      console.log(event.target);
      if (event.target.classList.contains('remove-item')) {
        let removeItem = event.target;
        this.removeCartItem(removeItem.dataset.id);
        // remove cart item from DOM
        cartContent.removeChild(removeItem.parentElement.parentElement);
      } else if (event.target.classList.contains('fa-chevron-up')) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let item = cart.find((item) => item.id === id);
        item.amount += 1;

        // save local storage
        Storage.saveCart(cart);

        // update DOM
        addAmount.nextElementSibling.innerText = item.amount;
        // update Total cost
        this.setCartValues(cart);
      } else if (event.target.classList.contains('fa-chevron-down')) {
        let decAmount = event.target;
        let id = decAmount.dataset.id;
        let item = cart.find((item) => item.id === id);
        item.amount -= 1;
        if (item.amount > 0) {
          // save local storage
          Storage.saveCart(cart);
          // update DOM
          decAmount.previousElementSibling.innerText = item.amount;
          // update Total cost
          this.setCartValues(cart);
        } else {
          cartContent.removeChild(decAmount.parentElement.parentElement);
          this.removeCartItem(id);
        }
      }
    });
  }
}

// Local storage
class Storage {
  // using static methods to avoid need to init storage class, but organized into a class strucutre
  static saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
  }

  static getProduct(id) {
    let product = JSON.parse(localStorage.getItem('products'));
    return product.find((product) => product.id === id);
  }

  static saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  static loadCart() {
    // if cart does not exist (tertrary opporator)
    return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
  }
}

// event listener to start program

document.addEventListener('DOMContentLoaded', () => {
  const ui = new UI();
  const products = new Products();

  // setup app
  ui.setupAPP();

  products
    .getProducts()
    .then((products) => {
      ui.displayProducts(products);
      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagButtons();
      ui.cartLogic();
    });
});
