from fastapi import Depends

from app.core.annotations import GetMapping, RestController
from app.core.dependencies import require_auth
from app.services.budget_service import BudgetService

# Budget Controller, which handles the budget breakdown for initiatives
@RestController(prefix="/initiatives", tags=["Budget"])
class BudgetController:
    # Get the budget breakdown for a specific initiative
    # does it by calling the BudgetService.get_breakdown method, 
    # which retrieves the budget details for the given initiative ID
    @GetMapping("/{initiative_id}/budget")
    async def get_budget(self, initiative_id: int, user: dict = Depends(require_auth)):
        return await BudgetService.get_breakdown(initiative_id)
