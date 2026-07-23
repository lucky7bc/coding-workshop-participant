from fastapi import Depends

from app.core.annotations import DeleteMapping, GetMapping, PostMapping, PutMapping, RestController
from app.core.dependencies import require_auth, require_role
from app.schemas.milestone_schemas import MilestoneCreate, MilestoneUpdate
from app.services.timeline_service import TimelineService

# Timeline Controller, which handles the timeline of initiatives, 
# including milestones and their statuses
@RestController(prefix="/initiatives", tags=["Timeline"])
class TimelineController:
     # Get the timeline for a specific initiative, including milestones and their statuses
    # it returns a list of milestones with their names, target weeks, 
    # and completion statuses
    @GetMapping("/{initiative_id}/timeline")
    async def get_timeline(self, initiative_id: int, user: dict = Depends(require_auth)):
        return await TimelineService.get_timeline(initiative_id)

    # Add a new milestone to a specific initiative
    @PostMapping("/{initiative_id}/milestones", status_code=201)
    async def add_milestone(
        self, initiative_id: int, body: MilestoneCreate, user: dict = Depends(require_role("admin"))
    ):
        return await TimelineService.add_milestone(initiative_id, body.name, body.target_week)

    # Update an existing milestone for a specific initiative
    @PutMapping("/{initiative_id}/milestones/{milestone_id}")
    async def update_milestone(
        self,
        initiative_id: int,
        milestone_id: str,
        body: MilestoneUpdate,
        user: dict = Depends(require_role("admin")),
    ):
        return await TimelineService.update_milestone(milestone_id, **body.model_dump(exclude_unset=True))

    # Delete a milestone from a specific initiative
    @DeleteMapping("/{initiative_id}/milestones/{milestone_id}", status_code=204)
    async def delete_milestone(
        self, initiative_id: int, milestone_id: str, user: dict = Depends(require_role("admin"))
    ):
        await TimelineService.remove_milestone(milestone_id)
