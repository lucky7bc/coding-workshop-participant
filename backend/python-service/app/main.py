from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.controllers.allocation_controller import AllocationController
from app.controllers.auth_controller import AuthController
from app.controllers.budget_controller import BudgetController
from app.controllers.deliverable_controller import DeliverableController
from app.controllers.initiative_controller import InitiativeController
from app.controllers.resource_controller import ResourceController
from app.controllers.timeline_controller import TimelineController
from app.controllers.user_controller import UserController
from app.core.database import connect_db
from app.core.errors import AppError


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    print("MongoDB connected")
    yield


app = FastAPI(title="Initiative Tracking System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message})


# Each @RestController class exposes `.router` — a real APIRouter — built by
# the annotations.py decorator. Registering them here is the direct analog
# of the Node backend's routes/index.ts mounting each router under /api.
for controller in [
    AuthController,
    ResourceController,
    InitiativeController,
    BudgetController,
    AllocationController,
    TimelineController,
    DeliverableController,
    UserController,
]:
    app.include_router(controller.router, prefix="/api")


if __name__ == "__main__":
    import uvicorn

    from app.core.config import settings

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)
