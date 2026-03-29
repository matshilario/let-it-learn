from __future__ import annotations

import csv
import io
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.question import Question
    from app.models.response import Response
    from app.models.student_session import StudentSession


def export_session_csv(
    student_sessions: list[StudentSession],
    questions: list[Question],
    responses_by_ss: dict[str, list[Response]],
) -> str:
    """Generate CSV string with session results.

    Columns: Student, Score, MaxScore, %, Time, Q1, Q2, ...
    Each Qn column shows "correct" / "incorrect" / "" for each student.
    """
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    header = ["Aluno", "Pontuacao", "PontuacaoMaxima", "Porcentagem", "Tempo(s)"]
    for i, _q in enumerate(questions, 1):
        header.append(f"Q{i}")
    writer.writerow(header)

    question_ids_ordered = [q.id for q in questions]

    for ss in student_sessions:
        name = ss.nickname or (str(ss.student_id)[:8] if ss.student_id else ss.anonymous_id or "Anonimo")
        pct = round(ss.score / ss.max_score * 100, 1) if ss.max_score > 0 else 0.0
        row = [name, ss.score, ss.max_score, pct, ss.time_spent_seconds]

        ss_responses = responses_by_ss.get(str(ss.id), [])
        response_map = {str(r.question_id): r for r in ss_responses}

        for qid in question_ids_ordered:
            resp = response_map.get(str(qid))
            if resp is None:
                row.append("")
            elif resp.is_correct:
                row.append("correto")
            else:
                row.append("incorreto")

        writer.writerow(row)

    return output.getvalue()
