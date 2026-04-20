# Phase 0: Payload-First Security TDD
## 1. Data Invariants
- **Users (`users/{userId}`)**: A user must authenticate to create their profile. They can only modify their own name and avatar. Immutable fields: `role`, `createdAt`. The system bypass creates Coach but via Google Login we'll handle standard flow.
- **Workouts (`workouts/{workoutId}`)**: Only coaches can create, update, or delete workouts. Students can only read workouts assigned to them.
- **Sessions (`sessions/{sessionId}`)**: Students create sessions when they finish a workout. Must contain `rpe` (1-10) and reference a valid `workoutId` assigned to them. Coaches can read sessions of any student.
- **Check-ins (`check_ins/{checkInId}`)**: Students create weekly check-ins. Coaches read them.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing**: User A tries to create a profile with User B's `uid`.
2. **Privilege Escalation**: Student tries to change their `role` from 'student' to 'coach' during an update.
3. **Orphaned Workout**: Coach creates a workout with an invalid `assignedTo` (non-existent student).
4. **Workout Hijacking**: Student tries to update another student's workout progress or a coach's workout definition.
5. **Ghost Session**: Student logs a session for a workout ID that doesn't exist.
6. **Denial of Wallet**: User injects a string of 1MB into the `instructions` field of a workout.
7. **Temporal Fraud**: Student creates a session with `createdAt` set to 5 days ago to cheat a streak.
8. **Value Poisoning**: Student logs an `rpe` value of "muito fácil" (string) instead of integer (1-10).
9. **Shadow Field**: Hacker adds `isAdmin: true` to their user profile creation payload.
10. **State Shortcutting**: Student skips workout completion and tries to award themselves points directly on their user object.
11. **PII Blanket Leak**: Unauthenticated user tries to read all user profiles.
12. **Cross-Tenant Leak**: Student tries to `get` the check-ins collection of another student.

## 3. Test Runner
(We will run this virtually via the Red Team logic validation)
