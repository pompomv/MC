from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Pen ──────────────────────────────────────────────────────────────
class PenBase(BaseModel):
    name: str
    location: Optional[str] = ""
    sector: Optional[str] = ""


class PenCreate(PenBase):
    pass


class PenUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    sector: Optional[str] = None
    is_active: Optional[bool] = None


class PenResponse(PenBase):
    id: int
    is_active: bool
    is_monitoring: bool
    last_status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Sensor Reading ────────────────────────────────────────────────────
class SensorReadingResponse(BaseModel):
    id: int
    pen_id: int
    temperature: float
    humidity: float
    timestamp: datetime

    class Config:
        from_attributes = True


# ── Activity Log ──────────────────────────────────────────────────────
class ActivityLogResponse(BaseModel):
    id: int
    pen_id: int
    message: str
    level: str
    timestamp: datetime

    class Config:
        from_attributes = True


# ── Threshold ─────────────────────────────────────────────────────────
class ThresholdBase(BaseModel):
    temp_min: float = 25.0
    temp_max: float = 30.0
    humidity_min: float = 60.0
    humidity_max: float = 80.0
    alert_critical: bool = True
    alert_warning: bool = True


class ThresholdUpdate(ThresholdBase):
    pass


class ThresholdResponse(ThresholdBase):
    id: int
    pen_id: int
    updated_at: datetime
    updated_by: str

    class Config:
        from_attributes = True


# ── Detail response with latest reading + threshold ───────────────────
class PenDetailResponse(PenResponse):
    latest_reading: Optional[SensorReadingResponse] = None
    threshold: Optional[ThresholdResponse] = None


# ── Analytics ─────────────────────────────────────────────────────────
class TrendDataPoint(BaseModel):
    label: str
    temperature: float
    humidity: float


class AnalyticsStats(BaseModel):
    temp_max: float
    temp_avg: float
    temp_min: float
    humidity_max: float
    humidity_avg: float
    humidity_min: float


class RawLogEntry(BaseModel):
    id: int
    timestamp: str
    sensor_id: str
    pen_name: str
    temperature: float
    humidity: float
    status: str


class PaginatedLogs(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    data: List[RawLogEntry]
