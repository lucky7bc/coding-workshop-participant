from fastapi import Depends
from app.core.annotations import DeleteMapping, PatchMapping, PostMapping, RestController
from app.core.database import get_db_client
from app.core.dependencies import require_role
from app.schemas.initiative_schemas import AllocationAdd, AllocationUpdate
from app.services.allocation_service import AllocationService

# Allocation Controller, which handles resource allocations for initiatives
@RestController(prefix="/initiatives", tags=["Allocation"])
class AllocationController:
    # Add a resource allocation to a specific initiative
    @PostMapping("/{initiative_id}/resources", status_code=201)
    async def add_allocation(
        self, initiative_id: int, body: AllocationAdd, user: dict = Depends(require_role("admin"))
    ):
        client = get_db_client()
        return await AllocationService.add_resource_to_initiative(
            client, initiative_id, body.resource_id, body.allocated_hours
        )

    # Update the allocated hours for a specific resource in a specific initiative
    @PatchMapping("/{initiative_id}/resources/{resource_id}")
    async def update_allocation(
        self,
        initiative_id: int,
        resource_id: int,
        body: AllocationUpdate,
        user: dict = Depends(require_role("admin")),
    ):
        client = get_db_client()
        return await AllocationService.update_allocated_hours(
            client, initiative_id, resource_id, body.allocated_hours
        )

    # Remove a resource allocation from a specific initiative
    @DeleteMapping("/{initiative_id}/resources/{resource_id}", status_code=204)
    async def remove_allocation(
        self, initiative_id: int, resource_id: int, user: dict = Depends(require_role("admin"))
    ):
        client = get_db_client()
        await AllocationService.remove_resource_from_initiative(client, initiative_id, resource_id)
