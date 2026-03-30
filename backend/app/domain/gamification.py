"""Gamification engine: time bonus, streak multiplier, XP calculation, and level progression.

The ``Activity.gamification`` JSONB field stores configuration::

    {
        "enabled": true,
        "time_bonus": true,           # award extra points for fast answers
        "time_bonus_max": 50,         # max bonus points per question (% of base)
        "streak_multiplier": true,    # multiply points on consecutive correct answers
        "streak_multiplier_max": 3.0, # cap for the multiplier
        "xp_per_point": 1,            # XP gained per point earned
        "xp_completion_bonus": 50     # flat XP for completing an activity
    }

Defaults are applied when keys are missing so teachers can opt in gradually.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

# ---- Configuration defaults ----

_DEFAULTS: dict[str, object] = {
    "enabled": False,
    "time_bonus": True,
    "time_bonus_max": 50,
    "streak_multiplier": True,
    "streak_multiplier_max": 3.0,
    "xp_per_point": 1,
    "xp_completion_bonus": 50,
}


def _cfg(gamification: dict | None, key: str) -> object:
    if not gamification:
        return _DEFAULTS[key]
    return gamification.get(key, _DEFAULTS[key])


# ---- Scoring ----


@dataclass
class ScoringResult:
    """Result of scoring a single response with gamification bonuses."""

    base_points: int
    time_bonus: int
    streak_multiplier: float
    total_points: int
    streak_count: int


def calculate_score(
    *,
    base_points: int,
    is_correct: bool | None,
    time_spent_seconds: int,
    time_limit_seconds: int | None,
    current_streak: int,
    gamification: dict | None,
) -> ScoringResult:
    """Calculate final points for a response including bonuses.

    Parameters
    ----------
    base_points:
        Points from grading (``question.points`` if correct, else 0).
    is_correct:
        Whether the answer is correct.
    time_spent_seconds:
        How long the student took.
    time_limit_seconds:
        Per-question time limit (``Question.time_limit_seconds`` or
        ``Activity.time_limit_seconds``).  ``None`` disables time bonus.
    current_streak:
        Number of *consecutive* correct answers **before** this one.
    gamification:
        The ``Activity.gamification`` JSONB dict (may be ``None``).
    """
    enabled = bool(_cfg(gamification, "enabled"))

    if not enabled or not is_correct:
        new_streak = (current_streak + 1) if is_correct else 0
        return ScoringResult(
            base_points=base_points,
            time_bonus=0,
            streak_multiplier=1.0,
            total_points=base_points,
            streak_count=new_streak,
        )

    # Time bonus: linear decay from time_bonus_max% down to 0% at the time limit
    time_bonus = 0
    if bool(_cfg(gamification, "time_bonus")) and time_limit_seconds and time_limit_seconds > 0:
        max_bonus_pct = int(_cfg(gamification, "time_bonus_max")) / 100
        remaining_ratio = max(0.0, 1.0 - time_spent_seconds / time_limit_seconds)
        time_bonus = round(base_points * max_bonus_pct * remaining_ratio)

    # Streak multiplier: grows by 0.25 per correct answer, capped
    streak_mult = 1.0
    new_streak = current_streak + 1
    if bool(_cfg(gamification, "streak_multiplier")):
        max_mult = float(_cfg(gamification, "streak_multiplier_max"))
        streak_mult = min(1.0 + (new_streak - 1) * 0.25, max_mult)

    total = round((base_points + time_bonus) * streak_mult)

    return ScoringResult(
        base_points=base_points,
        time_bonus=time_bonus,
        streak_multiplier=streak_mult,
        total_points=total,
        streak_count=new_streak,
    )


# ---- XP & Levels ----

# XP thresholds: level N requires ``100 * N * 1.5^(N-1)`` cumulative XP.
# Pre-computed for quick lookup up to level 50; beyond that, use the formula.
_XP_TABLE: list[int] = []


def _build_xp_table(max_level: int = 50) -> None:
    cumulative = 0
    for n in range(1, max_level + 1):
        needed = round(100 * n * (1.5 ** (n - 1)))
        cumulative += needed
        _XP_TABLE.append(cumulative)


_build_xp_table()


def xp_for_level(level: int) -> int:
    """Return cumulative XP required to reach *level* (1-indexed)."""
    if level <= 1:
        return 0
    idx = level - 1
    if idx < len(_XP_TABLE):
        return _XP_TABLE[idx - 1]
    # Fallback for very high levels
    cumulative = 0
    for n in range(1, level):
        cumulative += round(100 * n * (1.5 ** (n - 1)))
    return cumulative


def level_from_xp(total_xp: int) -> int:
    """Return the level a student has reached given their total XP."""
    for i, threshold in enumerate(_XP_TABLE):
        if total_xp < threshold:
            return i + 1  # levels are 1-indexed
    return len(_XP_TABLE) + 1


def calculate_xp_gain(
    *,
    total_points: int,
    session_completed: bool,
    gamification: dict | None,
) -> int:
    """Calculate XP gained from a session or single response.

    When called per-response, ``session_completed`` should be ``False``.
    When the session ends, call once more with ``session_completed=True``
    and ``total_points=0`` to award the completion bonus.
    """
    enabled = bool(_cfg(gamification, "enabled"))
    if not enabled:
        return 0

    xp_per_point = int(_cfg(gamification, "xp_per_point"))
    xp = total_points * xp_per_point

    if session_completed:
        xp += int(_cfg(gamification, "xp_completion_bonus"))

    return xp
