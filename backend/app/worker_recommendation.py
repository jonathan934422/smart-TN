from math import radians, sin, cos, sqrt, atan2


def calculate_distance_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    """
    Calculate distance between two GPS points using Haversine formula.
    """

    earth_radius_km = 6371

    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)

    a = (
        sin(d_lat / 2) ** 2
        + cos(radians(lat1))
        * cos(radians(lat2))
        * sin(d_lon / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a),
    )

    return earth_radius_km * c


def get_distance_score(distance_km: float) -> float:
    """
    Distance contributes maximum 40 points.
    """

    if distance_km <= 1:
        return 40

    if distance_km <= 3:
        return 35

    if distance_km <= 5:
        return 30

    if distance_km <= 10:
        return 20

    if distance_km <= 20:
        return 10

    return 5


def get_availability_score(
    availability_status: str,
) -> float:
    """
    Availability contributes maximum 25 points.
    """

    if availability_status == "AVAILABLE":
        return 25

    if availability_status == "BUSY":
        return 10

    return 0


def get_workload_score(
    current_workload: int,
) -> float:
    """
    Lower workload gets a better score.
    Maximum contribution is 20 points.
    """

    if current_workload <= 0:
        return 20

    if current_workload == 1:
        return 15

    if current_workload == 2:
        return 10

    if current_workload == 3:
        return 5

    return 0


def get_capability_score(
    waste_category: str,
    waste_capabilities: list[str] | None,
) -> float:
    """
    Waste handling capability contributes maximum 15 points.
    """

    if not waste_capabilities:
        return 0

    normalized_capabilities = [
        capability.strip().lower()
        for capability in waste_capabilities
    ]

    if waste_category.strip().lower() in normalized_capabilities:
        return 15

    return 0


def recommend_workers(
    report_latitude: float,
    report_longitude: float,
    waste_category: str,
    workers: list[dict],
):
    """
    Rank workers using:

    Distance       = 40%
    Availability   = 25%
    Workload       = 20%
    Capability     = 15%
    """

    recommendations = []

    for worker in workers:
        worker_latitude = worker.get("current_latitude")
        worker_longitude = worker.get("current_longitude")

        if (
            worker_latitude is None
            or worker_longitude is None
        ):
            distance_km = None
            distance_score = 0
        else:
            distance_km = calculate_distance_km(
                report_latitude,
                report_longitude,
                worker_latitude,
                worker_longitude,
            )

            distance_score = get_distance_score(
                distance_km
            )

        availability_score = (
            get_availability_score(
                worker.get(
                    "availability_status",
                    "OFF_DUTY",
                )
            )
        )

        workload_score = get_workload_score(
            worker.get(
                "current_workload",
                0,
            )
        )

        capability_score = (
            get_capability_score(
                waste_category,
                worker.get(
                    "waste_capabilities"
                ),
            )
        )

        total_score = (
            distance_score
            + availability_score
            + workload_score
            + capability_score
        )

        reasons = []

        if distance_km is not None:
            reasons.append(
                f"{distance_km:.2f} km from complaint"
            )
        else:
            reasons.append(
                "Worker location unavailable"
            )

        if worker.get(
            "availability_status"
        ) == "AVAILABLE":
            reasons.append("Worker is available")
        else:
            reasons.append(
                f"Worker status: {worker.get('availability_status')}"
            )

        reasons.append(
            f"Current workload: {worker.get('current_workload', 0)}"
        )

        capabilities = worker.get(
            "waste_capabilities"
        )

        if (
            capabilities
            and waste_category.lower()
            in [
                item.lower()
                for item in capabilities
            ]
        ):
            reasons.append(
                f"Can handle {waste_category}"
            )
        else:
            reasons.append(
                f"{waste_category} capability not confirmed"
            )

        recommendations.append(
            {
                "worker_id": worker.get("id"),
                "employee_code": worker.get(
                    "employee_code"
                ),
                "distance_km": (
                    round(distance_km, 2)
                    if distance_km is not None
                    else None
                ),
                "distance_score": distance_score,
                "availability_score": availability_score,
                "workload_score": workload_score,
                "capability_score": capability_score,
                "match_score": round(
                    total_score,
                    2,
                ),
                "reasons": reasons,
            }
        )

    recommendations.sort(
        key=lambda item: item["match_score"],
        reverse=True,
    )

    return recommendations