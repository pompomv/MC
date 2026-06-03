from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from contextlib import asynccontextmanager

from database import engine, Base
import models
from routers import pens, analytics, settings
from simulator import simulate_sensor_data, connected_clients


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    
    # Initialize some dummy pens if DB is empty
    from database import SessionLocal
    db = SessionLocal()
    try:
        if db.query(models.Pen).count() == 0:
            pens_data = [
                {"name": "Kandang A", "location": "Sector A - Indoor", "sector": "Nursery"},
                {"name": "Kandang B", "location": "Sector B - High Intensity", "sector": "Growth"},
                {"name": "Kandang C", "location": "Sector C - Outdoor", "sector": "Mating"},
            ]
            for p in pens_data:
                pen = models.Pen(**p)
                db.add(pen)
                db.flush()
                threshold = models.Threshold(pen_id=pen.id)
                db.add(threshold)
                log = models.ActivityLog(pen_id=pen.id, message=f"Sistem monitoring aktif untuk {pen.name}")
                db.add(log)
            db.commit()
    finally:
        db.close()

    # Start simulator task
    task = asyncio.create_task(simulate_sensor_data())
    
    yield
    
    # Shutdown
    task.cancel()


app = FastAPI(title="BSF IoT Monitor API", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(pens.router, prefix="/api/pens", tags=["Pens"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])


@app.websocket("/ws/sensors")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            # Just keep connection open, we broadcast from the simulator task
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
