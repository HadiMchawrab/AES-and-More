import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aes_app.db")

# Aiven hands out postgres:// URLs; SQLAlchemy 2.x wants postgresql://.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

_connect_args: dict = {}

if DATABASE_URL.startswith("sqlite"):
    _connect_args["check_same_thread"] = False
elif DATABASE_URL.startswith("postgresql"):
    # Aiven requires TLS. Default to sslmode=require; if CA cert path is
    # provided, upgrade to verify-full for full certificate validation.
    ca_cert_path = os.getenv("PG_SSL_ROOT_CERT")
    if ca_cert_path:
        _connect_args["sslmode"] = "verify-full"
        _connect_args["sslrootcert"] = ca_cert_path
    else:
        _connect_args["sslmode"] = os.getenv("PG_SSLMODE", "require")

engine = create_engine(DATABASE_URL, connect_args=_connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
