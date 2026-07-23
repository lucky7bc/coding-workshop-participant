# FastAPI application entry point. This file sets up the FastAPI app, 
#configures middleware, registers controllers, and defines the lifespan 
# context for database connection.

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


# Lifespan context manager for the FastAPI application. This function is called
# when the application starts and stops, allowing for setup and teardown of resources.
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


# Custom exception handler for AppError. This handler returns a JSON response
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message})


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
