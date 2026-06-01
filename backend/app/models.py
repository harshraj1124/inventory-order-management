from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class ProductBase(SQLModel):
    name: str = Field(min_length=1, max_length=120)
    sku: str = Field(min_length=1, max_length=60, index=True, unique=True)
    description: str | None = Field(default=None, max_length=500)
    price: float = Field(gt=0)
    stock: int = Field(default=0, ge=0)


class Product(ProductBase, table=True):
    id: int | None = Field(default=None, primary_key=True)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    sku: str | None = Field(default=None, min_length=1, max_length=60)
    description: str | None = Field(default=None, max_length=500)
    price: float | None = Field(default=None, gt=0)
    stock: int | None = Field(default=None, ge=0)


class ProductRead(ProductBase):
    id: int


class CustomerBase(SQLModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=120, index=True, unique=True)
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=500)


class Customer(CustomerBase, table=True):
    id: int | None = Field(default=None, primary_key=True)


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    email: str | None = Field(default=None, min_length=3, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=500)


class CustomerRead(CustomerBase):
    id: int


class OrderBase(SQLModel):
    customer_id: int = Field(foreign_key="customer.id")
    product_id: int = Field(foreign_key="product.id")
    quantity: int = Field(gt=0)


class Order(OrderBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    unit_price: float = Field(gt=0)
    total_price: float = Field(gt=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderCreate(OrderBase):
    pass


class OrderRead(OrderBase):
    id: int
    unit_price: float
    total_price: float
    created_at: datetime
