import asyncio
import json
import random
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
import models

# Global list of active WebSocket connections
connected_clients = set()


def get_pen_status(temp: float, hum: float, threshold: models.Threshold) -> str:
    if not threshold:
        return "stable"
    
    if (temp > threshold.temp_max * 1.10 or temp < threshold.temp_min * 0.90 or 
        hum > threshold.humidity_max * 1.10 or hum < threshold.humidity_min * 0.90):
        return "critical"
    
    if (temp > threshold.temp_max or temp < threshold.temp_min or 
        hum > threshold.humidity_max or hum < threshold.humidity_min):
        return "warning"
        
    return "optimal"


async def simulate_sensor_data():
    while True:
        db: Session = SessionLocal()
        try:
            pens = db.query(models.Pen).filter(models.Pen.is_active == True).all()
            
            updates = []
            for pen in pens:
                # Get last reading to make realistic changes
                last_reading = db.query(models.SensorReading).filter(models.SensorReading.pen_id == pen.id).order_by(models.SensorReading.timestamp.desc()).first()
                
                if last_reading:
                    # Fluctuate slightly
                    new_temp = last_reading.temperature + random.uniform(-0.5, 0.5)
                    new_hum = last_reading.humidity + random.uniform(-2.0, 2.0)
                    
                    # Keep within reasonable bounds
                    new_temp = max(20.0, min(40.0, new_temp))
                    new_hum = max(40.0, min(95.0, new_hum))
                else:
                    # Initial baseline
                    new_temp = random.uniform(25.0, 31.0)
                    new_hum = random.uniform(60.0, 80.0)

                new_temp = round(new_temp, 1)
                new_hum = round(new_hum, 1)

                reading = models.SensorReading(
                    pen_id=pen.id,
                    temperature=new_temp,
                    humidity=new_hum
                )
                db.add(reading)
                
                # Check status
                status = get_pen_status(new_temp, new_hum, pen.threshold)
                
                # Generate log if status changed to warning/critical
                if status != pen.last_status:
                    log_msg = f"Status changed to {status.upper()}. Temp: {new_temp}°C, Hum: {new_hum}%"
                    log = models.ActivityLog(
                        pen_id=pen.id,
                        message=log_msg,
                        level="critical" if status == "critical" else "warning" if status == "warning" else "info"
                    )
                    db.add(log)
                    pen.last_status = status

                updates.append({
                    "pen_id": pen.id,
                    "temperature": new_temp,
                    "humidity": new_hum,
                    "status": status,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                })

            db.commit()
            
            # Broadcast to WebSockets
            if connected_clients and updates:
                message = json.dumps({"type": "SENSOR_UPDATE", "data": updates})
                # Create a copy of the set to avoid RuntimeError if clients disconnect during iteration
                for client in list(connected_clients):
                    try:
                        await client.send_text(message)
                    except Exception:
                        connected_clients.discard(client)
                        
        except Exception as e:
            print(f"Error in simulator: {e}")
        finally:
            db.close()
            
        await asyncio.sleep(5)  # Simulate every 5 seconds
