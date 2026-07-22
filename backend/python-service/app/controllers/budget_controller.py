from fastapi import Depends

from app.core.annotations import GetMapping, RestController
from app.core.dependencies import require_auth
from app.services.budget_service import BudgetService


@RestController(prefix="/initiatives", tags=["Budget"])
class BudgetController:
    @GetMapping("/{initiative_id}/budget")
    async def get_budget(self, initiative_id: int, user: dict = Depends(require_auth)):
        return await BudgetService.get_breakdown(initiative_id)
