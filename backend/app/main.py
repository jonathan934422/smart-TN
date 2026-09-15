from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.ai.classifier import classify_waste
from app.ai.llm import generate_admin_summary
from app.worker_recommendation import recommend_workers


app = FastAPI(
    title="SmartWaste TN API",
    description="Backend API for SmartWaste TN",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class WorkerData(BaseModel):
    id: str
    employee_code: str | None = None
    availability_status: str
    current_workload: int = 0
    waste_capabilities: list[str] | None = None
    current_latitude: float | None = None
    current_longitude: float | None = None


class WorkerRecommendationRequest(BaseModel):
    report_latitude: float
    report_longitude: float
    waste_category: str
    workers: list[WorkerData]


class AdminSummaryRequest(BaseModel):
    complaint_data: str


@app.get("/")
def home():
    return {
        "message": "SmartWaste TN Backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "SmartWaste TN API"
    }


@app.post("/ai/classify")
async def classify_waste_image(
    image: UploadFile = File(...)
):
    allowed_types = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ]

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG, PNG and WEBP images are allowed."
        )

    try:
        image_bytes = await image.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty."
            )

        result = classify_waste(image_bytes)

        return {
            "success": True,
            "filename": image.filename,
            "classification": result,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"AI classification failed: {str(error)}"
        )


@app.post("/ai/admin-summary")
def admin_summary(
    request: AdminSummaryRequest
):
    try:
        if not request.complaint_data.strip():
            raise HTTPException(
                status_code=400,
                detail="Complaint data cannot be empty."
            )

        summary = generate_admin_summary(
            request.complaint_data
        )

        return {
            "success": True,
            "summary": summary,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"AI admin summary failed: {str(error)}"
        )


@app.post("/workers/recommend")
def recommend_worker(
    request: WorkerRecommendationRequest
):
    try:
        worker_dicts = [
            worker.model_dump()
            for worker in request.workers
        ]

        recommendations = recommend_workers(
            report_latitude=request.report_latitude,
            report_longitude=request.report_longitude,
            waste_category=request.waste_category,
            workers=worker_dicts,
        )

        best_worker = (
            recommendations[0]
            if recommendations
            else None
        )

        return {
            "success": True,
            "best_worker": best_worker,
            "recommendations": recommendations,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Worker recommendation failed: {str(error)}"
        )