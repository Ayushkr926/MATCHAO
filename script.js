document.documentElement.classList.add("js");

const storageKey = "matchao-cart";
let savedCart = [];
try {
    savedCart = JSON.parse(localStorage.getItem(storageKey) || "[]");
} catch {
    savedCart = [];
}
const cart = new Map(savedCart);
const cartDialog = document.querySelector(".cart-dialog");
const cartItems = document.querySelector(".cart-items");
const toast = document.querySelector(".toast");
let toastTimer;

function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function renderCart() {
    const quantity = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
    const total = [...cart.values()].reduce((sum, item) => sum + item.price * item.quantity, 0);
    document.querySelectorAll(".cart-count").forEach((count) => { count.textContent = quantity; });
    const dialogCount = document.querySelector(".dialog-count");
    const totalElement = document.querySelector(".cart-total strong");
    const emptyMessage = document.querySelector(".cart-empty");
    if (dialogCount) dialogCount.textContent = `(${quantity})`;
    if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
    if (emptyMessage) emptyMessage.hidden = quantity > 0;
    if (cartItems) {
        cartItems.replaceChildren();
        for (const [name, item] of cart) {
            const row = document.createElement("div");
            row.className = "cart-item";
            row.innerHTML = `<strong>${name}</strong><span>$${(item.price * item.quantity).toFixed(2)}</span><div class="quantity-controls"><button type="button" data-action="decrease" aria-label="Remove one ${name}">−</button><span>${item.quantity}</span><button type="button" data-action="increase" aria-label="Add one ${name}">+</button><button class="remove-item" type="button" data-action="remove">Remove</button></div>`;
            row.dataset.name = name;
            cartItems.append(row);
        }
    }
    try {
        localStorage.setItem(storageKey, JSON.stringify([...cart]));
    } catch {}
}

document.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => {
        const name = button.dataset.add;
        const item = cart.get(name) || { price: Number(button.dataset.price), quantity: 0 };
        item.quantity += 1;
        cart.set(name, item);
        renderCart();
        showToast(`${name} added to your bag`);
    });
});

document.querySelectorAll(".cart-trigger").forEach((button) => button.addEventListener("click", () => cartDialog?.showModal()));
document.querySelector(".cart-close")?.addEventListener("click", () => cartDialog?.close());
cartDialog?.addEventListener("click", (event) => {
    if (event.target === cartDialog) cartDialog.close();
});
cartItems?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const row = button.closest(".cart-item");
    const item = cart.get(row.dataset.name);
    if (!item) return;
    if (button.dataset.action === "remove" || (button.dataset.action === "decrease" && item.quantity === 1)) cart.delete(row.dataset.name);
    else item.quantity += button.dataset.action === "increase" ? 1 : -1;
    renderCart();
});
document.querySelector(".checkout-button")?.addEventListener("click", () => showToast("Demo checkout: your bag is saved here."));
renderCart();

const filterButtons = document.querySelectorAll(".filter-button");
const productCards = document.querySelectorAll(".product-card");
function filterProducts(category) {
    const searchTerm = document.querySelector("#catalog-search")?.value.trim().toLowerCase() || "";
    let visibleCount = 0;
    productCards.forEach((card) => {
        const categoryMatches = category === "all" || card.dataset.category === category;
        const searchMatches = !searchTerm || card.dataset.name?.toLowerCase().includes(searchTerm) || card.textContent.toLowerCase().includes(searchTerm);
        const visible = categoryMatches && searchMatches;
        card.classList.toggle("is-hidden", !visible);
        if (visible) visibleCount += 1;
    });
    filterButtons.forEach((button) => {
        const active = button.dataset.filter === category;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
    });
    const count = document.querySelector("#catalog-count");
    if (count) count.textContent = `${visibleCount} ${visibleCount === 1 ? "thoughtfully made thing" : "thoughtfully made things"}`;
}
filterButtons.forEach((button) => button.addEventListener("click", () => filterProducts(button.dataset.filter)));
document.querySelector("#catalog-search")?.addEventListener("input", () => {
    const activeCategory = document.querySelector(".filter-button.is-active")?.dataset.filter || "all";
    filterProducts(activeCategory);
});
document.querySelector("#catalog-sort")?.addEventListener("change", (event) => {
    const grid = document.querySelector("#catalog-grid");
    const cards = [...grid.querySelectorAll(".product-card")];
    cards.forEach((card, index) => {
        if (!card.dataset.order) card.dataset.order = index;
    });
    const sorters = {
        low: (first, second) => Number(first.dataset.price) - Number(second.dataset.price),
        high: (first, second) => Number(second.dataset.price) - Number(first.dataset.price),
        name: (first, second) => first.dataset.name.localeCompare(second.dataset.name)
    };
    cards.sort(sorters[event.target.value] || ((first, second) => Number(first.dataset.order) - Number(second.dataset.order)));
    cards.forEach((card) => grid.append(card));
});
document.querySelectorAll(".flavor-tags [data-filter]").forEach((link) => {
    link.addEventListener("click", () => filterProducts(link.dataset.filter === "ceremonial" ? "ceremonial" : "latte"));
});

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
menuToggle?.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    mainNav?.classList.toggle("is-open", !expanded);
    menuToggle.setAttribute("aria-label", expanded ? "Open menu" : "Close menu");
});
mainNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    mainNav.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open menu");
}));

const featureImages = [
    "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=2000&q=88",
    "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=2000&q=88",
    "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=2000&q=88"
];
let featureIndex = 0;
function changeFeature(direction) {
    const image = document.querySelector(".feature-image");
    if (!image) return;
    featureIndex = (featureIndex + direction + featureImages.length) % featureImages.length;
    image.style.opacity = "0.35";
    window.setTimeout(() => {
        image.src = featureImages[featureIndex];
        image.onload = () => { image.style.opacity = "1"; };
    }, 140);
}
document.querySelector(".feature-prev")?.addEventListener("click", () => changeFeature(-1));
document.querySelector(".feature-next")?.addEventListener("click", () => changeFeature(1));

const reviews = [
    { quote: "A little ritual that makes my mornings feel calmer. The flavor is fresh, the energy is steady, and I look forward to every cup.", name: "Maya Bennett", role: "Creative Director", image: "photo-1534528741775-53994a69daeb" },
    { quote: "The smoothest matcha I have found. It whisks beautifully, tastes bright, and keeps my afternoon focused without the jitters.", name: "Jordan Lee", role: "Product Designer", image: "photo-1500648767791-00dcc994a43e" },
    { quote: "It feels like a small reset in the middle of a busy day. The latte blend has become a permanent part of my kitchen shelf.", name: "Amara Okafor", role: "Founder & tea lover", image: "photo-1531123897727-8f129e1688ce" }
];
let reviewIndex = 0;
function renderReview() {
    const review = reviews[reviewIndex];
    const quote = document.querySelector("#review-text");
    const name = document.querySelector("#review-name");
    const role = document.querySelector("#review-role");
    const avatar = document.querySelector("#review-avatar");
    if (quote) quote.textContent = review.quote;
    if (name) name.textContent = review.name;
    if (role) role.textContent = review.role;
    if (avatar) avatar.src = `https://images.unsplash.com/${review.image}?auto=format&fit=crop&w=120&q=80`;
    document.querySelectorAll(".review-dot").forEach((dot, index) => {
        dot.classList.toggle("is-active", index === reviewIndex);
        if (index === reviewIndex) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
    });
}
document.querySelector(".review-prev")?.addEventListener("click", () => { reviewIndex = (reviewIndex + reviews.length - 1) % reviews.length; renderReview(); });
document.querySelector(".review-next")?.addEventListener("click", () => { reviewIndex = (reviewIndex + 1) % reviews.length; renderReview(); });
document.querySelectorAll(".review-dot").forEach((dot, index) => dot.addEventListener("click", () => { reviewIndex = index; renderReview(); }));

const servingsOutput = document.querySelector("#servings-count");
const brewModeButtons = document.querySelectorAll("[data-brew-mode]");
let servings = 1;
let brewMode = "traditional";
function updateRecipe() {
    if (!servingsOutput) return;
    servingsOutput.textContent = servings;
    document.querySelector("#matcha-amount").textContent = `${2 * servings} g`;
    document.querySelector("#water-amount").textContent = `${(brewMode === "latte" ? 30 : 60) * servings} ml`;
    document.querySelector("#water-note").textContent = brewMode === "latte" ? "cool filtered water" : "warm, not boiling";
    document.querySelector("#milk-amount").textContent = `${180 * servings} ml`;
    document.querySelector("#milk-recipe").hidden = brewMode !== "latte";
}
document.querySelectorAll("[data-servings]").forEach((button) => button.addEventListener("click", () => {
    servings = Math.min(6, Math.max(1, servings + (button.dataset.servings === "up" ? 1 : -1)));
    updateRecipe();
}));
brewModeButtons.forEach((button) => button.addEventListener("click", () => {
    brewMode = button.dataset.brewMode;
    brewModeButtons.forEach((modeButton) => {
        const active = modeButton === button;
        modeButton.classList.toggle("is-active", active);
        modeButton.setAttribute("aria-pressed", String(active));
    });
    updateRecipe();
}));
updateRecipe();

document.querySelector(".newsletter-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.querySelector("#email");
    if (!email.checkValidity()) {
        email.reportValidity();
        return;
    }
    document.querySelector(".form-message").textContent = "You're on the list. See you at tea time.";
    email.value = "";
});

const revealObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 }) : null;
document.querySelectorAll(".reveal").forEach((element) => {
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add("is-visible");
});