from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.database import get_session
from app.models import Customer, CustomerCreate, CustomerRead, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["customers"])


def normalize_email(email: str) -> str:
    return email.strip().lower()


def find_customer_by_email(session: Session, email: str) -> Customer | None:
    statement = select(Customer).where(Customer.email == normalize_email(email))
    return session.exec(statement).first()


@router.get("", response_model=list[CustomerRead])
def list_customers(session: Session = Depends(get_session)):
    return session.exec(select(Customer).order_by(Customer.id)).all()


@router.post("", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(customer_data: CustomerCreate, session: Session = Depends(get_session)):
    email = normalize_email(customer_data.email)
    if find_customer_by_email(session, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A customer with this email already exists.",
        )

    customer = Customer.model_validate(customer_data)
    customer.email = email
    session.add(customer)

    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A customer with this email already exists.",
        ) from None

    session.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerRead)
def get_customer(customer_id: int, session: Session = Depends(get_session)):
    customer = session.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")
    return customer


@router.patch("/{customer_id}", response_model=CustomerRead)
def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    session: Session = Depends(get_session),
):
    customer = session.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    changes = customer_data.model_dump(exclude_unset=True)
    new_email = changes.get("email")
    if new_email:
        normalized_email = normalize_email(new_email)
        if normalized_email != customer.email and find_customer_by_email(session, normalized_email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A customer with this email already exists.",
            )
        changes["email"] = normalized_email

    for field, value in changes.items():
        setattr(customer, field, value)

    session.add(customer)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A customer with this email already exists.",
        ) from None

    session.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, session: Session = Depends(get_session)):
    customer = session.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    session.delete(customer)
    session.commit()
