import datetime
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Pen(Base):
    __tablename__ = "pens"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, default="")
    sector = Column(String, default="")
    is_active = Column(Boolean, default=True)
    last_status = Column(String, default="optimal")  # optimal | warning | critical
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    readings = relationship("SensorReading", back_populates="pen", cascade="all, delete-orphan")
    logs = relationship("ActivityLog", back_populates="pen", cascade="all, delete-orphan")
    threshold = relationship("Threshold", back_populates="pen", uselist=False, cascade="all, delete-orphan")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    pen_id = Column(Integer, ForeignKey("pens.id"), nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    pen = relationship("Pen", back_populates="readings")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    pen_id = Column(Integer, ForeignKey("pens.id"), nullable=False)
    message = Column(String, nullable=False)
    level = Column(String, default="info")  # info | warning | critical
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    pen = relationship("Pen", back_populates="logs")


class Threshold(Base):
    __tablename__ = "thresholds"

    id = Column(Integer, primary_key=True, index=True)
    pen_id = Column(Integer, ForeignKey("pens.id"), unique=True, nullable=False)
    temp_min = Column(Float, default=25.0)
    temp_max = Column(Float, default=30.0)
    humidity_min = Column(Float, default=60.0)
    humidity_max = Column(Float, default=80.0)
    alert_critical = Column(Boolean, default=True)
    alert_warning = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_by = Column(String, default="system")

    pen = relationship("Pen", back_populates="threshold")
