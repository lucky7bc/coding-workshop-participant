from app.core.errors import AppError
from app.repositories.initiative_repository import InitiativeRepository
from app.repositories.resource_repository import ResourceRepository

# Service layer for budget-related operations
class BudgetService:
    # Retrieves a budget breakdown for a specific initiative,
    # including total spend, remaining budget, weekly burn rate,
    # projected spend at completion, and a detailed breakdown of
    # resource allocations and costs.
    @staticmethod
    async def get_breakdown(initiative_id: int) -> dict:
        initiative = await InitiativeRepository.find_by_id(initiative_id)
        if not initiative:
            raise AppError(404, "Initiative not found")

        # Allocated_hours is hours/week (recurring).
        effective_weeks = min(initiative.current_week, initiative.time_allocated)

        breakdown = []
        weekly_burn = 0.0
        for link in initiative.resources:
            resource = await ResourceRepository.find_by_id(link.resource_id)
            rate = resource.rate if resource else 0
            cost = link.allocated_hours * effective_weeks * rate
            weekly_burn += link.allocated_hours * rate
            breakdown.append(
                {
                    "resource_id": link.resource_id,
                    "resource_name": resource.name if resource else "Unknown (resource deleted)",
                    "allocated_hours": link.allocated_hours,
                    "rate": rate,
                    "cost": cost,
                }
            )

        total_spend = sum(item["cost"] for item in breakdown)
        # Pace projection: if current allocations run for the full planned
        # duration, total spend lands here. Same data, one multiplication —
        # answers "are we going to blow the budget" before it happens.
        projected_at_completion = weekly_burn * initiative.time_allocated

        return {
            "initiative_id": initiative_id,
            "budget": initiative.budget,
            "total_spend": total_spend,
            "remaining": initiative.budget - total_spend,
            "weekly_burn": weekly_burn,
            "projected_at_completion": projected_at_completion,
            "breakdown": breakdown,
        }
