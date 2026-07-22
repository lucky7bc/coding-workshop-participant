"""
Spring-Boot-style routing decorators built directly on top of FastAPI's real
APIRouter — not a separate framework, not a third-party class-based-view
library. Every route registered through @GetMapping/@RestController ends up
as an ordinary FastAPI route: full Pydantic validation, Depends()-based DI,
and auto-generated OpenAPI docs all still work exactly as they would with
plain FastAPI decorators. This file is the only place doing anything
non-standard; everything downstream of it is idiomatic FastAPI.

Usage mirrors Spring MVC:

    @RestController(prefix="/resources", tags=["Resources"])
    class ResourceController:
        @GetMapping("")
        async def list_resources(self):
            return await ResourceService.list()

        @GetMapping("/{resource_id}")
        async def get_resource(self, resource_id: int):
            return await ResourceService.get(resource_id)
"""

from dataclasses import dataclass
from typing import Callable

from fastapi import APIRouter


@dataclass
class _RouteMeta:
    method: str
    path: str
    status_code: int | None


def _mapping(method: str):
    def decorator(path: str = "", status_code: int | None = None):
        def wrapper(func: Callable) -> Callable:
            func.__route_meta__ = _RouteMeta(method=method, path=path, status_code=status_code)
            return func

        return wrapper

    return decorator


GetMapping = _mapping("GET")
PostMapping = _mapping("POST")
PutMapping = _mapping("PUT")
PatchMapping = _mapping("PATCH")
DeleteMapping = _mapping("DELETE")


def RestController(prefix: str = "", tags: list[str] | None = None):
    """Class decorator ~ Spring's @RestController + @RequestMapping(prefix)
    combined. Scans the class for methods tagged by @GetMapping etc. and
    registers each onto a real APIRouter, exposed as `cls.router` for
    main.py to `app.include_router(...)`.
    """

    def decorator(cls):
        router = APIRouter(prefix=prefix, tags=tags or [cls.__name__])
        instance = cls()

        for name in dir(cls):
            attr = getattr(cls, name, None)
            meta: _RouteMeta | None = getattr(attr, "__route_meta__", None)
            if meta is None:
                continue

            # Bound method — `self` is already applied here, so FastAPI's
            # signature introspection (which drives its dependency
            # injection) only ever sees the remaining declared parameters.
            bound_handler = getattr(instance, name)
            router.add_api_route(
                meta.path,
                bound_handler,
                methods=[meta.method],
                status_code=meta.status_code,
            )

        cls.router = router
        return cls

    return decorator
