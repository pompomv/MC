from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
import schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.PenDetailResponse])
def list_pens(db: Session = Depends(get_db)):
    pens = db.query(models.Pen).filter(models.Pen.is_active == True).all()
    result = []
    for pen in pens:
        latest = (
            db.query(models.SensorReading)
            .filter(models.SensorReading.pen_id == pen.id)
            .order_by(models.SensorReading.timestamp.desc())
            .first()
        )
        result.append(
            schemas.PenDetailResponse(
                id=pen.id,
                name=pen.name,
                location=pen.location,
                sector=pen.sector,
                is_active=pen.is_active,
                last_status=pen.last_status,
                created_at=pen.created_at,
                latest_reading=latest,
                threshold=pen.threshold,
            )
        )
    return result


@router.post("/", response_model=schemas.PenDetailResponse, status_code=201)
def create_pen(pen_in: schemas.PenCreate, db: Session = Depends(get_db)):
    pen = models.Pen(**pen_in.model_dump())
    db.add(pen)
    db.flush()

    threshold = models.Threshold(pen_id=pen.id)
    db.add(threshold)

    log = models.ActivityLog(
        pen_id=pen.id,
        message=f"Kandang {pen.name} berhasil ditambahkan ke sistem monitoring",
        level="info",
    )
    db.add(log)
    db.commit()
    db.refresh(pen)
    return schemas.PenDetailResponse(
        id=pen.id, name=pen.name, location=pen.location, sector=pen.sector,
        is_active=pen.is_active, last_status=pen.last_status, created_at=pen.created_at,
        latest_reading=None, threshold=pen.threshold,
    )


@router.get("/{pen_id}", response_model=schemas.PenDetailResponse)
def get_pen(pen_id: int, db: Session = Depends(get_db)):
    pen = db.query(models.Pen).filter(models.Pen.id == pen_id).first()
    if not pen:
        raise HTTPException(status_code=404, detail="Kandang tidak ditemukan")
    latest = (
        db.query(models.SensorReading)
        .filter(models.SensorReading.pen_id == pen_id)
        .order_by(models.SensorReading.timestamp.desc())
        .first()
    )
    return schemas.PenDetailResponse(
        id=pen.id, name=pen.name, location=pen.location, sector=pen.sector,
        is_active=pen.is_active, last_status=pen.last_status, created_at=pen.created_at,
        latest_reading=latest, threshold=pen.threshold,
    )


@router.put("/{pen_id}", response_model=schemas.PenResponse)
def update_pen(pen_id: int, pen_in: schemas.PenUpdate, db: Session = Depends(get_db)):
    pen = db.query(models.Pen).filter(models.Pen.id == pen_id).first()
    if not pen:
        raise HTTPException(status_code=404, detail="Kandang tidak ditemukan")
    for key, val in pen_in.model_dump(exclude_none=True).items():
        setattr(pen, key, val)
    db.commit()
    db.refresh(pen)
    return pen


@router.delete("/{pen_id}", status_code=204)
def delete_pen(pen_id: int, db: Session = Depends(get_db)):
    pen = db.query(models.Pen).filter(models.Pen.id == pen_id).first()
    if not pen:
        raise HTTPException(status_code=404, detail="Kandang tidak ditemukan")
    pen.is_active = False
    db.commit()


@router.get("/{pen_id}/readings", response_model=List[schemas.SensorReadingResponse])
def get_readings(pen_id: int, hours: int = 24, limit: int = 100, db: Session = Depends(get_db)):
    import datetime
    since = datetime.datetime.utcnow() - datetime.timedelta(hours=hours)
    readings = (
        db.query(models.SensorReading)
        .filter(
            models.SensorReading.pen_id == pen_id,
            models.SensorReading.timestamp >= since,
        )
        .order_by(models.SensorReading.timestamp.asc())
        .limit(limit)
        .all()
    )
    return readings


@router.get("/{pen_id}/logs", response_model=List[schemas.ActivityLogResponse])
def get_logs(pen_id: int, limit: int = 20, db: Session = Depends(get_db)):
    logs = (
        db.query(models.ActivityLog)
        .filter(models.ActivityLog.pen_id == pen_id)
        .order_by(models.ActivityLog.timestamp.desc())
        .limit(limit)
        .all()
    )
    return logs
