from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import datetime

from database import get_db
import models
import schemas

router = APIRouter()


@router.get("/{pen_id}/threshold", response_model=schemas.ThresholdResponse)
def get_threshold(pen_id: int, db: Session = Depends(get_db)):
    threshold = db.query(models.Threshold).filter(models.Threshold.pen_id == pen_id).first()
    if not threshold:
        raise HTTPException(status_code=404, detail="Threshold configuration not found")
    return threshold


@router.put("/{pen_id}/threshold", response_model=schemas.ThresholdResponse)
def update_threshold(pen_id: int, threshold_in: schemas.ThresholdUpdate, db: Session = Depends(get_db)):
    threshold = db.query(models.Threshold).filter(models.Threshold.pen_id == pen_id).first()
    if not threshold:
        raise HTTPException(status_code=404, detail="Threshold configuration not found")

    for key, val in threshold_in.model_dump().items():
        setattr(threshold, key, val)
    
    threshold.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(threshold)
    return threshold
