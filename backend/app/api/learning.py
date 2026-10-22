from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from backend.app.models import Lesson, QuizQuestion, UserProgress
from backend.app.api.deps import get_db, get_current_user
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, func
from datetime import datetime, timezone


router = APIRouter(prefix="/learning", tags=["learning"])


class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_answer: int
    explanation: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)


class LessonResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    order: int
    content: Optional[str]
    level: Optional[str]
    questions: List[QuizQuestionResponse] = []
    
    model_config = ConfigDict(from_attributes=True)


class LessonListResponse(BaseModel):
    items: List[LessonResponse]
    total: int


class UserProgressResponse(BaseModel):
    id: int
    user_id: str
    lesson_id: int
    completed: bool
    score: Optional[int]
    completed_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


class SubmitProgressRequest(BaseModel):
    score: int


@router.get("", response_model=LessonListResponse)
async def list_lessons(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(Lesson).order_by(Lesson.order))
    lessons = result.scalars().all()
    
    lesson_responses = []
    for lesson in lessons:
        q_result = await db.execute(
            select(QuizQuestion).where(QuizQuestion.lesson_id == lesson.id)
        )
        questions = q_result.scalars().all()
        
        lesson_responses.append(LessonResponse(
            id=lesson.id,
            title=lesson.title,
            description=lesson.description,
            order=lesson.order,
            content=lesson.content,
            level=lesson.level,
            questions=[
                QuizQuestionResponse(
                    id=q.id,
                    question=q.question,
                    options=q.options,
                    correct_answer=q.correct_answer,
                    explanation=q.explanation,
                )
                for q in questions
            ],
        ))
    
    return LessonListResponse(items=lesson_responses, total=len(lesson_responses))


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    q_result = await db.execute(
        select(QuizQuestion).where(QuizQuestion.lesson_id == lesson_id)
    )
    questions = q_result.scalars().all()
    
    return LessonResponse(
        id=lesson.id,
        title=lesson.title,
        description=lesson.description,
        order=lesson.order,
        content=lesson.content,
        level=lesson.level,
        questions=[
            QuizQuestionResponse(
                id=q.id,
                question=q.question,
                options=q.options,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
            )
            for q in questions
        ],
    )


@router.get("/progress/me", response_model=List[UserProgressResponse])
async def get_my_progress(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("sub")
    result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user_id)
    )
    progress = result.scalars().all()
    return progress


@router.post("/progress/{lesson_id}", response_model=UserProgressResponse)
async def submit_lesson_progress(
    lesson_id: int,
    request: SubmitProgressRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.lesson_id == lesson_id,
        )
    )
    progress = result.scalar_one_or_none()
    
    if progress:
        progress.completed = request.score >= 70
        progress.score = request.score
        progress.completed_at = datetime.now(timezone.utc) if progress.completed else None
        progress.updated_at = datetime.now(timezone.utc)
    else:
        progress = UserProgress(
            user_id=user_id,
            lesson_id=lesson_id,
            completed=request.score >= 70,
            score=request.score,
            completed_at=datetime.now(timezone.utc) if request.score >= 70 else None,
        )
        db.add(progress)
    
    await db.commit()
    await db.refresh(progress)
    return progress