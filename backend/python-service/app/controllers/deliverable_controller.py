from fastapi import Depends

from app.core.annotations import DeleteMapping, GetMapping, PatchMapping, PostMapping, RestController
from app.core.dependencies import require_auth, require_role
from app.schemas.deliverable_schemas import DeliverableCreate, DeliverableUpdate
from app.services.deliverable_service import DeliverableService


@RestController(prefix="/initiatives", tags=["Deliverables"])
class DeliverableController:
    @GetMapping("/{initiative_id}/deliverables")
    async def list_deliverables(self, initiative_id: int, user: dict = Depends(require_auth)):
        return await DeliverableService.list_all(initiative_id)

    @PostMapping("/{initiative_id}/deliverables", status_code=201)
    async def add_deliverable(
        self, initiative_id: int, body: DeliverableCreate, user: dict = Depends(require_role("admin"))
    ):
        return await DeliverableService.add(initiative_id, body.name)

    # Open to any authenticated member, not just admins — confirmed:
    # whoever owns a deliverable can mark it done without needing admin
    # rights. Same as the Node backend's routing decision.
    @PatchMapping("/{initiative_id}/deliverables/{deliverable_id}")
    async def update_deliverable(
        self,
        initiative_id: int,
        deliverable_id: str,
        body: DeliverableUpdate,
        user: dict = Depends(require_auth),
    ):
        return await DeliverableService.update(deliverable_id, **body.model_dump(exclude_unset=True))

    @DeleteMapping("/{initiative_id}/deliverables/{deliverable_id}", status_code=204)
    async def delete_deliverable(
        self, initiative_id: int, deliverable_id: str, user: dict = Depends(require_role("admin"))
    ):
        await DeliverableService.remove(deliverable_id)
