import { FormEvent, useEffect, useMemo, useState } from "react";
import { PackagePlus, Pencil, ReceiptText, RefreshCw, Trash2, UserPlus } from "lucide-react";

import { apiRequest } from "./api";
import type {
  Customer,
  CustomerFormData,
  Order,
  OrderFormData,
  Product,
  ProductFormData,
} from "./types";
import "./styles.css";

const LOW_STOCK_THRESHOLD = 5;

const emptyProductForm: ProductFormData = {
  name: "",
  sku: "",
  description: "",
  price: "",
  stock: "",
};

const emptyCustomerForm: CustomerFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

const emptyOrderForm: OrderFormData = {
  customerId: "",
  productId: "",
  quantity: "1",
};

type ActiveTab = "dashboard" | "products" | "customers" | "orders";

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState<ProductFormData>(emptyProductForm);
  const [customerFormData, setCustomerFormData] = useState<CustomerFormData>(emptyCustomerForm);
  const [orderFormData, setOrderFormData] = useState<OrderFormData>(emptyOrderForm);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + order.total_price, 0),
    [orders],
  );

  const lowStockProducts = useMemo(
    () =>
      products
        .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
        .sort((a, b) => a.stock - b.stock),
    [products],
  );

  const selectedProduct = products.find((p) => String(p.id) === orderFormData.productId);
  const selectedCustomer = customers.find((c) => String(c.id) === orderFormData.customerId);

  async function loadProducts() {
    setIsLoadingProducts(true);
    try {
      setProducts(await apiRequest<Product[]>("/products"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load products.");
    } finally {
      setIsLoadingProducts(false);
    }
  }

  async function loadCustomers() {
    setIsLoadingCustomers(true);
    try {
      setCustomers(await apiRequest<Customer[]>("/customers"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load customers.");
    } finally {
      setIsLoadingCustomers(false);
    }
  }

  async function loadOrders() {
    setIsLoadingOrders(true);
    try {
      setOrders(await apiRequest<Order[]>("/orders"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders.");
    } finally {
      setIsLoadingOrders(false);
    }
  }

  async function refreshCurrentTab() {
    setError("");
    setMessage("");
    if (activeTab === "products") {
      await loadProducts();
    } else if (activeTab === "customers") {
      await loadCustomers();
    } else {
      await Promise.all([loadProducts(), loadCustomers(), loadOrders()]);
    }
  }

  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadOrders();
  }, []);

  useEffect(() => {
    setError("");
    setMessage("");
    setEditingProduct(null);
    setProductFormData(emptyProductForm);
  }, [activeTab]);

  function updateProductField(field: keyof ProductFormData, value: string) {
    setProductFormData((cur) => ({ ...cur, [field]: value }));
  }

  function updateCustomerField(field: keyof CustomerFormData, value: string) {
    setCustomerFormData((cur) => ({ ...cur, [field]: value }));
  }

  function updateOrderField(field: keyof OrderFormData, value: string) {
    setOrderFormData((cur) => ({ ...cur, [field]: value }));
  }

  function startEditProduct(product: Product) {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      sku: product.sku,
      description: product.description ?? "",
      price: String(product.price),
      stock: String(product.stock),
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingProduct(null);
    setProductFormData(emptyProductForm);
    setError("");
    setMessage("");
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);
    try {
      await apiRequest<Product>("/products", {
        method: "POST",
        body: {
          name: productFormData.name.trim(),
          sku: productFormData.sku.trim(),
          description: productFormData.description.trim() || null,
          price: Number(productFormData.price),
          stock: Number(productFormData.stock),
        },
      });
      setProductFormData(emptyProductForm);
      setMessage("Product added successfully.");
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProduct) return;
    setError("");
    setMessage("");
    setIsSaving(true);
    try {
      await apiRequest<Product>(`/products/${editingProduct.id}`, {
        method: "PATCH",
        body: {
          name: productFormData.name.trim(),
          sku: productFormData.sku.trim(),
          description: productFormData.description.trim() || null,
          price: Number(productFormData.price),
          stock: Number(productFormData.stock),
        },
      });
      setEditingProduct(null);
      setProductFormData(emptyProductForm);
      setMessage("Product updated successfully.");
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update product.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteProduct(productId: number) {
    setError("");
    setMessage("");
    try {
      await apiRequest<void>(`/products/${productId}`, { method: "DELETE" });
      if (editingProduct?.id === productId) cancelEdit();
      setMessage("Product deleted.");
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete product.");
    }
  }

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);
    try {
      await apiRequest<Customer>("/customers", {
        method: "POST",
        body: {
          name: customerFormData.name.trim(),
          email: customerFormData.email.trim(),
          phone: customerFormData.phone.trim() || null,
          address: customerFormData.address.trim() || null,
        },
      });
      setCustomerFormData(emptyCustomerForm);
      setMessage("Customer added successfully.");
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save customer.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCustomer(customerId: number) {
    setError("");
    setMessage("");
    try {
      await apiRequest<void>(`/customers/${customerId}`, { method: "DELETE" });
      setMessage("Customer deleted.");
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete customer.");
    }
  }

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);
    try {
      await apiRequest<Order>("/orders", {
        method: "POST",
        body: {
          customer_id: Number(orderFormData.customerId),
          product_id: Number(orderFormData.productId),
          quantity: Number(orderFormData.quantity),
        },
      });
      setOrderFormData(emptyOrderForm);
      setMessage("Order placed and stock updated.");
      await Promise.all([loadOrders(), loadProducts()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteOrder(orderId: number) {
    setError("");
    setMessage("");
    try {
      await apiRequest<void>(`/orders/${orderId}`, { method: "DELETE" });
      setMessage("Order cancelled and stock restored.");
      await Promise.all([loadOrders(), loadProducts()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel order.");
    }
  }

  function getCustomerName(customerId: number) {
    return customers.find((c) => c.id === customerId)?.name ?? `Customer #${customerId}`;
  }

  function getProductName(productId: number) {
    return products.find((p) => p.id === productId)?.name ?? `Product #${productId}`;
  }

  const titleMap: Record<ActiveTab, string> = {
    dashboard: "Dashboard",
    products: "Products",
    customers: "Customers",
    orders: "Orders",
  };

  const subtitleMap: Record<ActiveTab, string> = {
    dashboard: "A quick overview of your inventory and activity.",
    products: "Add products, track stock, and keep SKUs unique.",
    customers: "Keep customer contact details clean and emails unique.",
    orders: "Place orders only when enough stock is available.",
  };

  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Inventory desk</p>
          <h1>{titleMap[activeTab]}</h1>
          <p className="subtle">{subtitleMap[activeTab]}</p>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={refreshCurrentTab}
          title={`Refresh ${activeTab}`}
        >
          <RefreshCw size={18} />
        </button>
      </section>

      <nav className="tabs" aria-label="Main sections">
        {(["dashboard", "products", "customers", "orders"] as ActiveTab[]).map((tab) => (
          <button
            className={activeTab === tab ? "tab active" : "tab"}
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {titleMap[tab]}
          </button>
        ))}
      </nav>

      <section className="summary-strip" aria-label="Quick stats">
        <div>
          <span>Products</span>
          <strong>{products.length}</strong>
        </div>
        <div>
          <span>Customers</span>
          <strong>{customers.length}</strong>
        </div>
        <div>
          <span>Orders</span>
          <strong>{orders.length}</strong>
        </div>
        <div className={lowStockProducts.length > 0 ? "alert-card" : ""}>
          <span>Low stock</span>
          <strong>{lowStockProducts.length}</strong>
        </div>
      </section>

      {/* ---- DASHBOARD ---- */}
      {activeTab === "dashboard" && (
        <section className="dashboard">
          <div className="dashboard-stats">
            <div className="stat-card">
              <span>Total Products</span>
              <strong>{products.length}</strong>
            </div>
            <div className="stat-card">
              <span>Total Customers</span>
              <strong>{customers.length}</strong>
            </div>
            <div className="stat-card">
              <span>Total Orders</span>
              <strong>{orders.length}</strong>
            </div>
            <div className="stat-card accent">
              <span>Total Revenue</span>
              <strong>
                Rs.{" "}
                {totalRevenue.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>
          </div>

          <section className="panel">
            <div className="panel-title">
              <h2>Low stock alert</h2>
              {lowStockProducts.length > 0 && (
                <span className="count-badge">{lowStockProducts.length}</span>
              )}
            </div>
            <p className="subtle" style={{ marginBottom: "14px", fontSize: "0.9rem" }}>
              Products with {LOW_STOCK_THRESHOLD} or fewer units remaining. Restock soon to avoid
              missed orders.
            </p>

            {isLoadingProducts ? (
              <p className="empty-state">Loading...</p>
            ) : lowStockProducts.length === 0 ? (
              <p className="empty-state">All products are well stocked. Great job!</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <strong>{product.name}</strong>
                          {product.description && <small>{product.description}</small>}
                        </td>
                        <td>{product.sku}</td>
                        <td>Rs. {product.price.toFixed(2)}</td>
                        <td>
                          <span
                            className={
                              product.stock === 0 ? "stock-badge empty" : "stock-badge low"
                            }
                          >
                            {product.stock === 0 ? "Out of stock" : product.stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      )}

      {/* ---- PRODUCTS ---- */}
      {activeTab === "products" && (
        <section className="work-area">
          <form
            className="panel data-form"
            onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
          >
            <div className="panel-title">
              {editingProduct ? <Pencil size={19} /> : <PackagePlus size={19} />}
              <h2>{editingProduct ? "Edit product" : "Add product"}</h2>
            </div>

            <label>
              Product name
              <input
                required
                value={productFormData.name}
                onChange={(e) => updateProductField("name", e.target.value)}
                placeholder="Wireless mouse"
              />
            </label>

            <label>
              SKU
              <input
                required
                value={productFormData.sku}
                onChange={(e) => updateProductField("sku", e.target.value)}
                placeholder="MOUSE-001"
              />
            </label>

            <label>
              Description
              <textarea
                value={productFormData.description}
                onChange={(e) => updateProductField("description", e.target.value)}
                placeholder="Optional short note"
                rows={3}
              />
            </label>

            <div className="two-columns">
              <label>
                Price
                <input
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={productFormData.price}
                  onChange={(e) => updateProductField("price", e.target.value)}
                  placeholder="499"
                />
              </label>

              <label>
                Stock
                <input
                  required
                  min="0"
                  step="1"
                  type="number"
                  value={productFormData.stock}
                  onChange={(e) => updateProductField("stock", e.target.value)}
                  placeholder="25"
                />
              </label>
            </div>

            <div className={editingProduct ? "form-actions two-col" : "form-actions"}>
              <button className="primary-button" type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : editingProduct ? "Update product" : "Save product"}
              </button>
              {editingProduct && (
                <button className="secondary-button" type="button" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          <section className="panel">
            <div className="panel-title">
              <h2>Product list</h2>
            </div>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}

            {isLoadingProducts ? (
              <p className="empty-state">Loading products...</p>
            ) : products.length === 0 ? (
              <p className="empty-state">No products yet. Add the first product from the form.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className={editingProduct?.id === product.id ? "editing-row" : ""}
                      >
                        <td>
                          <strong>{product.name}</strong>
                          {product.description && <small>{product.description}</small>}
                        </td>
                        <td>{product.sku}</td>
                        <td>Rs. {product.price.toFixed(2)}</td>
                        <td>
                          <span
                            className={
                              product.stock === 0
                                ? "stock-badge empty"
                                : product.stock <= LOW_STOCK_THRESHOLD
                                  ? "stock-badge low"
                                  : "stock-badge"
                            }
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="icon-button"
                              type="button"
                              onClick={() => startEditProduct(product)}
                              title={`Edit ${product.name}`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="icon-button danger"
                              type="button"
                              onClick={() => handleDeleteProduct(product.id)}
                              title={`Delete ${product.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      )}

      {/* ---- CUSTOMERS ---- */}
      {activeTab === "customers" && (
        <section className="work-area">
          <form className="panel data-form" onSubmit={handleCreateCustomer}>
            <div className="panel-title">
              <UserPlus size={19} />
              <h2>Add customer</h2>
            </div>

            <label>
              Customer name
              <input
                required
                value={customerFormData.name}
                onChange={(e) => updateCustomerField("name", e.target.value)}
                placeholder="Aarav Sharma"
              />
            </label>

            <label>
              Email
              <input
                required
                type="email"
                value={customerFormData.email}
                onChange={(e) => updateCustomerField("email", e.target.value)}
                placeholder="aarav@example.com"
              />
            </label>

            <label>
              Phone
              <input
                value={customerFormData.phone}
                onChange={(e) => updateCustomerField("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </label>

            <label>
              Address
              <textarea
                value={customerFormData.address}
                onChange={(e) => updateCustomerField("address", e.target.value)}
                placeholder="Optional address"
                rows={3}
              />
            </label>

            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save customer"}
            </button>
          </form>

          <section className="panel">
            <div className="panel-title">
              <h2>Customer list</h2>
            </div>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}

            {isLoadingCustomers ? (
              <p className="empty-state">Loading customers...</p>
            ) : customers.length === 0 ? (
              <p className="empty-state">
                No customers yet. Add the first customer from the form.
              </p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <strong>{customer.name}</strong>
                        </td>
                        <td>{customer.email}</td>
                        <td>{customer.phone || "—"}</td>
                        <td>{customer.address || "—"}</td>
                        <td>
                          <button
                            className="icon-button danger"
                            type="button"
                            onClick={() => handleDeleteCustomer(customer.id)}
                            title={`Delete ${customer.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      )}

      {/* ---- ORDERS ---- */}
      {activeTab === "orders" && (
        <section className="work-area">
          <form className="panel data-form" onSubmit={handleCreateOrder}>
            <div className="panel-title">
              <ReceiptText size={19} />
              <h2>Place order</h2>
            </div>

            <label>
              Customer
              <select
                required
                value={orderFormData.customerId}
                onChange={(e) => updateOrderField("customerId", e.target.value)}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} — {customer.email}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Product
              <select
                required
                value={orderFormData.productId}
                onChange={(e) => updateOrderField("productId", e.target.value)}
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id} disabled={product.stock === 0}>
                    {product.name} —{" "}
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Quantity
              <input
                required
                min="1"
                max={selectedProduct?.stock ?? undefined}
                step="1"
                type="number"
                value={orderFormData.quantity}
                onChange={(e) => updateOrderField("quantity", e.target.value)}
              />
            </label>

            <div className="order-preview">
              <span>Selected customer</span>
              <strong>{selectedCustomer?.name ?? "Not selected"}</strong>
              <span>Available stock</span>
              <strong>{selectedProduct ? selectedProduct.stock : "—"}</strong>
              <span>Estimated total</span>
              <strong>
                {selectedProduct
                  ? `Rs. ${(selectedProduct.price * Number(orderFormData.quantity || 0)).toFixed(2)}`
                  : "—"}
              </strong>
            </div>

            <button
              className="primary-button"
              type="submit"
              disabled={isSaving || products.length === 0 || customers.length === 0}
            >
              {isSaving ? "Placing..." : "Place order"}
            </button>
          </form>

          <section className="panel">
            <div className="panel-title">
              <h2>Order history</h2>
            </div>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}

            {products.length === 0 || customers.length === 0 ? (
              <p className="empty-state">
                Add at least one product and one customer before placing orders.
              </p>
            ) : isLoadingOrders ? (
              <p className="empty-state">Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="empty-state">No orders yet. Place the first order from the form.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Total</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>#{order.id}</strong>
                          <small>
                            {new Date(order.created_at).toLocaleDateString("en-IN")}
                          </small>
                        </td>
                        <td>{getCustomerName(order.customer_id)}</td>
                        <td>{getProductName(order.product_id)}</td>
                        <td>{order.quantity}</td>
                        <td>Rs. {order.total_price.toFixed(2)}</td>
                        <td>
                          <button
                            className="icon-button danger"
                            type="button"
                            onClick={() => handleDeleteOrder(order.id)}
                            title={`Cancel order #${order.id}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      )}
    </main>
  );
}

export default App;
