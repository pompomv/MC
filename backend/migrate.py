import sys
import sqlalchemy
from sqlalchemy import text
from database import engine

def run_migration():
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE pens ADD COLUMN is_monitoring BOOLEAN DEFAULT FALSE"))
            print("Successfully added is_monitoring column to pens table.")
    except sqlalchemy.exc.OperationalError as e:
        if "Duplicate column name" in str(e):
            print("Column is_monitoring already exists.")
        else:
            print(f"Error: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_migration()
