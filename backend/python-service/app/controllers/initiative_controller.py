from fastapi import Depends

from app.core.annotations import DeleteMapping, GetMapping, PostMapping, PutMapping, RestController
from app.core.dependencies import require_auth, require_role
from app.schemas.initiative_schemas import InitiativeCreate, InitiativeUpdate
from app.services.initiative_service import InitiativeService


@RestController(prefix="/initiatives", tags=["Initiatives"])
class InitiativeController:
    @GetMapping("")
    async def list_initiatives(self, user: dict = Depends(require_auth)):
        return await InitiativeService.list_all()

    @GetMapping("/{initiative_id}")
    async def get_initiative(self, initiative_id: int, user: dict = Depends(require_auth)):
        return await InitiativeService.get(initiative_id)

    @PostMapping("", status_code=201)
    async def create_initiative(self, body: InitiativeCreate, user: dict = Depends(require_role("admin"))):
        return await InitiativeService.create(body.name, body.budget, body.time_allocated)

    @PutMapping("/{initiative_id}")
    async def update_initiative(
        self, initiative_id: int, body: InitiativeUpdate, user: dict = Depends(require_role("admin"))
    ):
        return await InitiativeService.update(initiative_id, **body.model_dump(exclude_unset=True))

    @DeleteMapping("/{initiative_id}", status_code=204)
    async def delete_initiative(self, initiative_id: int, user: dict = Depends(require_role("admin"))):
        await InitiativeService.remove(initiative_id)
