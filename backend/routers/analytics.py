import csv
import datetime
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
import models
import schemas

router = APIRouter()


def _determine_status(temp: float, humidity: float, threshold) -> str:
    if threshold is None:
        return "stable"
    over_t = temp > threshold.temp_max or temp < threshold.temp_min
    over_h = humidity > threshold.humidity_max or humidity < threshold.humidity_min
    critical_t = temp > threshold.temp_max * 1.10 or temp < threshold.temp_min * 0.90
    critical_h = humidity > threshold.humidity_max * 1.10 or humidity < threshold.humidity_min * 0.90
    if critical_t or critical_h:
        return "critical"
    if over_t or over_h:
        return "warning"
    return "stable"


@router.get("/trend", response_model=List[schemas.TrendDataPoint])
def get_trend(
    period: str = Query("24h", description="24h | 7d | 30d"),
    pen_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    now = datetime.datetime.utcnow()
    if period == "7d":
        since = now - datetime.timedelta(days=7)
        fmt = "%Y-%m-%d"
    elif period == "30d":
        since = now - datetime.timedelta(days=30)
        fmt = "%Y-%m-%d"
    else:  # 24h
        since = now - datetime.timedelta(hours=24)
        fmt = "%H:00"

    query = db.query(models.SensorReading).filter(models.SensorReading.timestamp >= since)
    if pen_id:
        query = query.filter(models.SensorReading.pen_id == pen_id)

    readings = query.order_by(models.SensorReading.timestamp.asc()).all()

    # Group manually
    buckets: dict = {}
    for r in readings:
        label = r.timestamp.strftime(fmt)
        if label not in buckets:
            buckets[label] = {"temps": [], "humidities": []}
        buckets[label]["temps"].append(r.temperature)
        buckets[label]["humidities"].append(r.humidity)

    result = []
    for label, vals in sorted(buckets.items()):
        result.append(
            schemas.TrendDataPoint(
                label=label,
                temperature=round(sum(vals["temps"]) / len(vals["temps"]), 1),
                humidity=round(sum(vals["humidities"]) / len(vals["humidities"]), 1),
            )
        )
    return result


@router.get("/stats", response_model=schemas.AnalyticsStats)
def get_stats(
    period: str = Query("24h"),
    pen_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    now = datetime.datetime.utcnow()
    hours = 24 if period == "24h" else (7 * 24 if period == "7d" else 30 * 24)
    since = now - datetime.timedelta(hours=hours)

    query = db.query(models.SensorReading).filter(models.SensorReading.timestamp >= since)
    if pen_id:
        query = query.filter(models.SensorReading.pen_id == pen_id)

    readings = query.all()
    if not readings:
        return schemas.AnalyticsStats(
            temp_max=0, temp_avg=0, temp_min=0,
            humidity_max=0, humidity_avg=0, humidity_min=0,
        )

    temps = [r.temperature for r in readings]
    hums = [r.humidity for r in readings]
    return schemas.AnalyticsStats(
        temp_max=round(max(temps), 1),
        temp_avg=round(sum(temps) / len(temps), 1),
        temp_min=round(min(temps), 1),
        humidity_max=round(max(hums), 1),
        humidity_avg=round(sum(hums) / len(hums), 1),
        humidity_min=round(min(hums), 1),
    )


@router.get("/rawlogs", response_model=schemas.PaginatedLogs)
def get_raw_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    filter_text: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.SensorReading, models.Pen)
        .join(models.Pen, models.SensorReading.pen_id == models.Pen.id)
        .order_by(models.SensorReading.timestamp.desc())
    )

    all_rows = query.all()
    total = len(all_rows)

    # Build entries and apply optional text filter
    entries: List[schemas.RawLogEntry] = []
    for reading, pen in all_rows:
        status = _determine_status(reading.temperature, reading.humidity, pen.threshold)
        entry = schemas.RawLogEntry(
            id=reading.id,
            timestamp=reading.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            sensor_id=f"S-{pen.name.replace(' ', '-')}",
            pen_name=pen.name,
            temperature=reading.temperature,
            humidity=reading.humidity,
            status=status,
        )
        if filter_text:
            haystack = f"{entry.timestamp} {entry.sensor_id} {entry.pen_name} {status}".lower()
            if filter_text.lower() not in haystack:
                continue
        entries.append(entry)

    if filter_text:
        total = len(entries)

    offset = (page - 1) * page_size
    paginated = entries[offset: offset + page_size]
    total_pages = max(1, (total + page_size - 1) // page_size)

    return schemas.PaginatedLogs(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        data=paginated,
    )


@router.get("/export/csv")
def export_csv(
    period: str = Query("24h"),
    db: Session = Depends(get_db),
):
    now = datetime.datetime.utcnow()
    hours = 24 if period == "24h" else (7 * 24 if period == "7d" else 30 * 24)
    since = now - datetime.timedelta(hours=hours)

    rows = (
        db.query(models.SensorReading, models.Pen)
        .join(models.Pen, models.SensorReading.pen_id == models.Pen.id)
        .filter(models.SensorReading.timestamp >= since)
        .order_by(models.SensorReading.timestamp.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Timestamp", "Sensor ID", "Kandang", "Suhu (°C)", "Kelembaban (%)", "Status"])
    for reading, pen in rows:
        status = _determine_status(reading.temperature, reading.humidity, pen.threshold)
        writer.writerow([
            reading.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            f"S-{pen.name.replace(' ', '-')}",
            pen.name,
            reading.temperature,
            reading.humidity,
            status.upper(),
        ])

    output.seek(0)
    filename = f"bsf_monitor_{period}_{now.strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
