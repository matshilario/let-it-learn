from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_teacher
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.database import get_db
from app.models.module import Module
from app.models.teacher import Teacher
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.module import ModuleCreate, ModuleResponse, ModuleUpdate

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[ModuleResponse])
async def list_modules(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ModuleResponse]:
    base = select(Module).where(Module.teacher_id == teacher.id)
    total_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = total_result.scalar() or 0
    result = await db.execute(
        base.order_by(Module.sort_order, Module.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    modules = result.scalars().all()
    return PaginatedResponse(
        items=[ModuleResponse.model_validate(m) for m in modules],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("/", response_model=ModuleResponse, status_code=201)
async def create_module(
    body: ModuleCreate,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> ModuleResponse:
    module = Module(teacher_id=teacher.id, **body.model_dump())
    db.add(module)
    await db.flush()
    await db.refresh(module)
    return ModuleResponse.model_validate(module)


async def _get_module(module_id: uuid.UUID, teacher: Teacher, db: AsyncSession) -> Module:
    result = await db.execute(select(Module).where(Module.id == module_id))
    module = result.scalar_one_or_none()
    if not module:
        raise NotFoundException("Module not found")
    if module.teacher_id != teacher.id:
        raise ForbiddenException("Not your module")
    return module


@router.get("/{module_id}", response_model=ModuleResponse)
async def get_module(
    module_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> ModuleResponse:
    module = await _get_module(module_id, teacher, db)
    return ModuleResponse.model_validate(module)


@router.put("/{module_id}", response_model=ModuleResponse)
async def update_module(
    module_id: uuid.UUID,
    body: ModuleUpdate,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> ModuleResponse:
    module = await _get_module(module_id, teacher, db)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(module, key, value)
    await db.flush()
    await db.refresh(module)
    return ModuleResponse.model_validate(module)


@router.delete("/{module_id}", response_model=MessageResponse)
async def delete_module(
    module_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    module = await _get_module(module_id, teacher, db)
    await db.delete(module)
    await db.flush()
    return MessageResponse(message="Module deleted")


@router.post("/{module_id}/duplicate", response_model=ModuleResponse, status_code=201)
async def duplicate_module(
    module_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> ModuleResponse:
    original = await _get_module(module_id, teacher, db)
    new_module = Module(
        teacher_id=teacher.id,
        title=f"{original.title} (copy)",
        description=original.description,
        cover_image_url=original.cover_image_url,
        is_published=False,
        sort_order=original.sort_order,
        settings=original.settings,
    )
    db.add(new_module)
    await db.flush()
    await db.refresh(new_module)
    return ModuleResponse.model_validate(new_module)


@router.put("/{module_id}/publish", response_model=ModuleResponse)
async def publish_module(
    module_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
) -> ModuleResponse:
    module = await _get_module(module_id, teacher, db)
    module.is_published = not module.is_published
    await db.flush()
    await db.refresh(module)
    return ModuleResponse.model_validate(module)
