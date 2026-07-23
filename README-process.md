# Development Journal — Thought Process & Design Decisions

This document records how the Initiative Tracking System was designed and built: the decisions made, the reasoning behind them, and the problems hit along the way. It is organized by theme rather than strict chronology.

## Stack selection

The requirements fixed the endpoints of the stack — React frontend, Python backend, MongoDB — but left the middle open. I chose **FastAPI** over Django or Flask for three reasons: Django's ORM, admin, and migrations are SQL-native and fight MongoDB's grain; Flask ships with no validation, dependency injection, or API documentation, meaning everything gets bolted on by hand; FastAPI is async-native, validates through Pydantic, and generates OpenAPI documentation automatically. A deciding factor was that FastAPI's decorator-based routing maps cleanly onto Spring-style annotations, which let me build `@RestController` / `@GetMapping` decorators as a thin wrapper over real FastAPI — familiar enterprise Java conventions on the outside, standard FastAPI underneath, with Swagger docs still generated for free.

On the frontend I paired **Material UI** for components with **react-responsive** for layout decisions, aligning the react-responsive breakpoints to MUI's own scale so the two systems never disagree about what "mobile" means.

## Backend architecture

The service uses a strict four-layer flow: **controller → service → repository → model**, with Pydantic schemas validating input at the door and a `core/` package holding cross-cutting machinery (JWT auth, role checks, the annotation system, database setup, shared error types).

Two rules kept the layers honest. First, *one service per concern, not per entity* — budget math, allocations, and timelines each get their own service rather than bloating the initiative service, because each is a distinct concern with its own endpoint. Second, *cross-cutting logic never lives in a feature* — role enforcement is a `core/` dependency that every write route declares, not code repeated inside services.

## Data model decisions

**Bidirectional embedded links.** An allocation ("this person works N hours/week on this initiative") is stored on *both* sides: the initiative holds its resource links, and the resource holds mirror initiative links. This makes both list pages fast — each renders from a single query — at the cost of double bookkeeping. That cost is contained in one place: `allocation_service.py` wraps every allocation write in a **MongoDB multi-document transaction**, so the two sides update together or not at all. When entity deletion later created dangling-link bugs, the fix followed the same philosophy: deleting an initiative strips its links from every resource, and deleting a resource strips its links from every initiative, making deletion order irrelevant.

**Sequential numeric IDs.** Resources and initiatives use a counter-generated `numeric_id` (1, 2, 3…) rather than raw Mongo ObjectIds, for readable URLs and human-friendly references. Milestones and deliverables, which are only ever addressed within their initiative, use Mongo `_id` directly.

**Derived, never stored.** Anything computable from stored facts is computed at read time: budget spend, weekly burn, projections, timeline progress, at-risk signals, workload levels. This eliminates an entire class of staleness bugs — there is no "recalculate" step to forget. The most deliberate application is risk: the system derives at-risk evidence (overdue milestones, over-budget pace) and displays it prominently, but never overwrites the human-set status. The system supplies evidence; a person keeps authority over the verdict.

## The budget model

Rates are dollars per hour; allocations are hours per week; therefore spend is `hours × rate × weeks elapsed`. One subtlety mattered: weeks elapsed is capped at the planned duration (`min(current_week, time_allocated)`), so an initiative pushed past its planned end doesn't inflate spend forever. The same formula is implemented twice on purpose — once in the backend budget service, once client-side on the initiatives list — so portfolio cards can render spend bars with zero extra API calls, and the numbers provably agree because the math is identical.

## Authentication and access control

JWT access tokens (15-minute lifetime) with rotating refresh tokens, hashed at rest and revoked on user deletion. The frontend hides the short expiry entirely through a *single-flight* refresh: any 401 pauses the failed request, one refresh runs no matter how many requests failed simultaneously, and the originals replay.

Roles went through a real decision cycle. The final ruling: **managers are read-only everywhere; all writes are admin-only**, enforced at both layers — `require_role("admin")` on the API and conditional rendering in the UI (write controls don't exist in a manager's page, rather than existing disabled). The self-demotion and self-deletion guards exist because the alternative is an administrator locking everyone out of user management permanently.

## Validation philosophy

Three gates: the UI refuses to send obviously bad input (disabled buttons, typed fields); Pydantic schemas reject wrong shapes and types with structured 422s; services enforce contextual rules (no duplicate allocations, no operating on missing entities). Range validation is deliberately concentrated at the UI gate, with read paths written defensively (division guards, fallback names, text clamps) so that any garbage entering via direct API use degrades the display rather than crashing it — a posture chosen consciously for a system whose only API clients are its own UI and its own administrators.

## Frontend design process

Every significant screen went through a **mockup-first loop**: two or three visual options rendered and compared with explicit trade-offs before any code. Several designs were genuine syntheses of that process — the resource-card allocation layout, for example, started as chips (which broke on long names), split into "truncate with pinned hours" versus "wrap everything" options, and landed on a hybrid: ledger rows with hours pinned right and names allowed two lines before ellipsizing. The workload system similarly emerged from iterating on how a manager should *notice* over-allocation, ending with a dual-signal design — a 40-hour capacity bar and initiative-count thresholds (≤3 healthy, 4–5 risky, 6+ overloaded), the card taking the worse of the two levels, and the overloaded state made unmissable: dark red header, red border, warning badge.

The UI's mechanical philosophy is uniform: state lives in `useState`, visuals are formulas over that state, CSS transitions turn state changes into motion, and contexts broadcast app-wide facts (theme, auth) from the top. Mutations follow "write, then reload" — slightly slower than optimistic updates, but the screen always shows what the database actually contains.

## Debugging war stories worth recording

**The stale index.** Resource creation began failing with `E11000 duplicate key … id: null`. Root cause: the retired Node backend's Mongoose had left a unique index on a field (`id`) the Python documents no longer carry — every insert after the first collided on `null`. The fix was dropping the leftover indexes; the lesson was that *database state outlives code*, and the fingerprint (`background: true` on the index) identified the culprit's origin.

**Import-time fragility.** A single accidental keystroke — a deleted `if` line above its `raise` — produced a syntax error that took down all 28 endpoints at once, because Python imports the whole app at Lambda startup. Diagnosis came from the Lambda logs naming the file and line. The permanent mitigation: a pre-deploy compile check across every source file.

**Environment drift.** Guarded patches (Python scripts that assert an exact anchor exists before editing) caught two real divergences between expected and actual file contents — once from a corrupted terminal paste, once from a style difference (`Optional[int]` vs `int | None`). The asserts turned would-be silent corruption into loud, safe stops. Related lesson: LocalStack runs with persistence disabled, so a machine restart silently deletes the deployed Lambda while MongoDB keeps its data — the recovery is always `terraform apply`.

## Testing approach

Automated unit tests were out of scope by explicit decision; testing is a two-part system instead. A **smoke-test script** exercises all 28 endpoints with ~45 assertions: full CRUD on every entity, RBAC denials per role, auth failures, duplicate-allocation rejection, budget math verified to the dollar, both directions of deletion cleanup, and the self-demotion guard. A **frontend checklist** walks every page's operations twice — once as admin, once as manager — including responsive behavior, dark mode, token-refresh-after-idle, and deep-link handling.

## Demonstration features

Two additions were built specifically to make the system's ideas visible. **Dark mode** required converting hardcoded text colors to theme tokens across five pages — the toggle itself was three lines; the vocabulary conversion was the work. The **portfolio time machine** is a slider that scrubs the entire portfolio through simulated weeks: because spend is a deterministic function of the week number, and the list page already holds all allocation, rate, and milestone data, simulation is pure client-side arithmetic — bars animate, thresholds trip, and overdue markers appear as the scrubber passes milestone target weeks, with nothing written anywhere. It reframes the tracker as a forecaster using only math the app already had.

## Known limitations, recorded deliberately

Dependency chains between deliverables are scoped (schema field, cycle validation, "blocked by" display) but consciously deferred. The deliverable-completion endpoint is slightly more permissive server-side than the read-only UI implies. Range validation at the API layer is thinner than at the UI. Concurrent edits to the same field are last-write-wins with no conflict detection. The initiatives list makes one timeline request per initiative (accepted N+1 at demo scale). Each of these is a known trade-off with a sketched fix, not an unknown.

##### Sketches #####

When I initially started working on this problem, I decided that my first step would be to get an idea of nouns and verbs. That is, what entities will we need to define, what defining values will they need attributed (parameters), and what do these entities need to do. This is defined on the first page of the notes located at:

#### ./LogicFlow.pdf ####

On page 2, I begin to work out a logi flow for the UI and how access to different pages will work. The goal here was to understand how an end user would navigate the site and, through simulation, gain a better idea of what features a user would need. This, ultimately, allowed me to understand, in the next step, some early API endpoints I would then need.

Page 3 is where I begin fleshing out basic API endpoints that I will need to route on the backend. I also began to think about what search/filter parameters I wanted to consider, and address the specific endpoints at a later time.

Page 4 is where I take the thoughts from the UI frontend and API endpoint pages, and begin architecting the schema for my MongoDB database. This was an iterative process to an extent, as evidenced by the arrows where decisions on parameters to add were made later on in the process.

The sketches on pagges 5-9 occur later in the process. Once the backend logic and MongoDB database are connected and communicating properly, I began working on rough first drafts of what I wanted the landing page and subsequent application pages to look. In several instances, considerations are made for meaningful features that are to be implemented. I wanted to be intentional about considering where these features were located on a given page. Though not every draft was ultimately implemented as shown on these pages, decisions made here were iterated and considered extensively to allow for a clean UI. This process also allowed me to prompt the AI agent to not just produce a UI for each page, but to follow a specifc design schema that ensured a modern, fresh, and convienant layout at all times.