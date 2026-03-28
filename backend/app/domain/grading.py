from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.question import Question


def grade_response(question: Question, answer: dict) -> tuple[bool | None, int]:
    """Grade a student response based on question type.

    Supports 7 question types:
    - multiple_choice: single correct answer from options
    - multiple_select: multiple correct answers from options
    - true_false: boolean answer
    - short_answer: text match (case-insensitive)
    - fill_in_blank: text match for blank fields
    - ordering: correct sequence of items
    - matching: correct pairs of items

    Returns:
        (is_correct, points_earned)
    """
    q_type = question.question_type
    points = question.points

    graders = {
        "multiple_choice": _grade_multiple_choice,
        "multiple_select": _grade_multiple_select,
        "true_false": _grade_true_false,
        "short_answer": _grade_short_answer,
        "fill_in_blank": _grade_fill_in_blank,
        "ordering": _grade_ordering,
        "matching": _grade_matching,
    }

    grader = graders.get(q_type)
    if not grader:
        return None, 0

    is_correct = grader(question, answer)
    points_earned = points if is_correct else 0
    return is_correct, points_earned


def _grade_multiple_choice(question: Question, answer: dict) -> bool:
    """Expects answer: {"selected_option_id": "<uuid>"}"""
    selected = answer.get("selected_option_id")
    if not selected:
        return False
    for option in question.options:
        if str(option.id) == str(selected) and option.is_correct:
            return True
    return False


def _grade_multiple_select(question: Question, answer: dict) -> bool:
    """Expects answer: {"selected_option_ids": ["<uuid>", ...]}"""
    selected = set(str(s) for s in answer.get("selected_option_ids", []))
    if not selected:
        return False
    correct_ids = set(str(o.id) for o in question.options if o.is_correct)
    return selected == correct_ids


def _grade_true_false(question: Question, answer: dict) -> bool:
    """Expects answer: {"value": true/false}"""
    student_value = answer.get("value")
    if student_value is None:
        return False
    correct_value = question.content.get("correct_answer")
    if correct_value is None:
        for option in question.options:
            if option.is_correct:
                correct_value = option.content.lower() == "true"
                break
    return bool(student_value) == bool(correct_value)


def _grade_short_answer(question: Question, answer: dict) -> bool:
    """Expects answer: {"text": "student answer"}"""
    student_text = (answer.get("text") or "").strip().lower()
    if not student_text:
        return False

    # Check against accepted answers in content
    accepted = question.content.get("accepted_answers", [])
    if accepted:
        return student_text in [a.strip().lower() for a in accepted]

    # Fallback to checking options
    for option in question.options:
        if option.is_correct and option.content.strip().lower() == student_text:
            return True
    return False


def _grade_fill_in_blank(question: Question, answer: dict) -> bool:
    """Expects answer: {"blanks": {"0": "answer1", "1": "answer2", ...}}"""
    blanks = answer.get("blanks", {})
    if not blanks:
        return False

    expected = question.content.get("blanks", {})
    if not expected:
        return False

    for key, expected_value in expected.items():
        student_value = (blanks.get(str(key)) or "").strip().lower()
        if isinstance(expected_value, list):
            if student_value not in [v.strip().lower() for v in expected_value]:
                return False
        else:
            if student_value != str(expected_value).strip().lower():
                return False
    return True


def _grade_ordering(question: Question, answer: dict) -> bool:
    """Expects answer: {"order": ["id1", "id2", ...]}"""
    student_order = [str(x) for x in answer.get("order", [])]
    if not student_order:
        return False

    correct_order = question.content.get("correct_order", [])
    if correct_order:
        return student_order == [str(x) for x in correct_order]

    # Fallback: use options sorted by sort_order
    sorted_options = sorted(question.options, key=lambda o: o.sort_order)
    correct_order = [str(o.id) for o in sorted_options]
    return student_order == correct_order


def _grade_matching(question: Question, answer: dict) -> bool:
    """Expects answer: {"pairs": {"source_id": "target_id", ...}}"""
    student_pairs = answer.get("pairs", {})
    if not student_pairs:
        return False

    correct_pairs = question.content.get("correct_pairs", {})
    if correct_pairs:
        return {str(k): str(v) for k, v in student_pairs.items()} == {
            str(k): str(v) for k, v in correct_pairs.items()
        }

    # Fallback: use options with match_target_id
    expected = {}
    for option in question.options:
        if option.match_target_id:
            expected[str(option.id)] = str(option.match_target_id)

    return {str(k): str(v) for k, v in student_pairs.items()} == expected
