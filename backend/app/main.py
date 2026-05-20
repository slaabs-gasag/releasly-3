import asyncio
import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.models.errors import AuthenticationError, IntegrationUnavailableError, ProjectNotFoundError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.services.release_service import background_refresh_loop

    task = asyncio.create_task(background_refresh_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Releasly API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AuthenticationError)
async def auth_error_handler(request: Request, exc: AuthenticationError):
    return JSONResponse(
        status_code=401,
        content={
            "type": "https://releasly.internal/errors/authentication",
            "title": "Authentication Failed",
            "status": 401,
            "detail": str(exc),
        },
    )


@app.exception_handler(IntegrationUnavailableError)
async def unavailable_error_handler(request: Request, exc: IntegrationUnavailableError):
    return JSONResponse(
        status_code=503,
        content={
            "type": "https://releasly.internal/errors/integration-unavailable",
            "title": "Integration Unavailable",
            "status": 503,
            "detail": str(exc),
        },
    )


@app.exception_handler(ProjectNotFoundError)
async def not_found_error_handler(request: Request, exc: ProjectNotFoundError):
    return JSONResponse(
        status_code=404,
        content={
            "type": "https://releasly.internal/errors/project-not-found",
            "title": "Project Not Found",
            "status": 404,
            "detail": str(exc),
        },
    )


from app.routers import projects, releases, stats  # noqa: E402

app.include_router(projects.router, prefix="/api")
app.include_router(releases.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
