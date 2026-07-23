from fastapi import Depends

from app.core.annotations import DeleteMapping, GetMapping, PostMapping, PutMapping, RestController
from app.core.dependencies import require_auth, require_role
from app.schemas.resource_schemas import ResourceCreate, ResourceUpdate
from app.services.resource_service import ResourceService

# Resource Controller
@RestController(prefix="/resources", tags=["Resources"])
class ResourceController:
    # List all resources
    @GetMapping("")
    async def list_resources(self, user: dict = Depends(require_auth)):
        return await ResourceService.list_all()

    # Get a specific resource by its ID
    @GetMapping("/{resource_id}")
    async def get_resource(self, resource_id: int, user: dict = Depends(require_auth)):
        return await ResourceService.get(resource_id)

    # Create a new resource
    @PostMapping("", status_code=201)
    async def create_resource(self, body: ResourceCreate, user: dict = Depends(require_role("admin"))):
        return await ResourceService.create(body.name, body.rate)

    # Update an existing resource
    @PutMapping("/{resource_id}")
    async def update_resource(self, resource_id: int, body: ResourceUpdate, user: dict = Depends(require_role("admin"))):
        return await ResourceService.update(resource_id, **body.model_dump(exclude_unset=True))

    # Delete a resource by its ID
    @DeleteMapping("/{resource_id}", status_code=204)
    async def delete_resource(self, resource_id: int, user: dict = Depends(require_role("admin"))):
        await ResourceService.remove(resource_id)
