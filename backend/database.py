from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Default MySQL credentials (root with no password)
# Pastikan database 'bsf_monitor' sudah dibuat di MySQL Anda!
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost/bsf_monitor"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
