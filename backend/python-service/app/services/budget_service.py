from app.core.errors import AppError
from app.repositories.initiative_repository import InitiativeRepository
from app.repositories.resource_repository import ResourceRepository


class BudgetService:
    @staticmethod
    async def get_breakdown(initiative_id: int) -> dict:
        initiative = await InitiativeRepository.find_by_id(initiative_id)
        if not initiative:
            raise AppError(404, "Initiative not found")

        breakdown = []
        for link in initiative.resources:
            resource = await ResourceRepository.find_by_id(link.resource_id)

            # CONFIRMED: allocated_hours is hours/week (recurring), not a
            # one-time total or an FTE fraction. Cost = hours/week × weeks
            # elapsed × hourly rate. Same confirmed assumption as the Node
            # backend's budget.service.ts.
            cost = link.allocated_hours * initiative.current_week * resource.rate if resource else 0

            breakdown.append(
                {
                    "resource_id": link.resource_id,
                    "resource_name": resource.name if resource else "Unknown (resource deleted)",
                    "allocated_hours": link.allocated_hours,
                    "rate": resource.rate if resource else 0,
                    "cost": cost,
                }
            )

        total_spend = sum(item["cost"] for item in breakdown)

        return {
            "initiative_id": initiative_id,
            "budget": initiative.budget,
            "total_spend": total_spend,
            "remaining": initiative.budget - total_spend,
            "breakdown": breakdown,
        }
