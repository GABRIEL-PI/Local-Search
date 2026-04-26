from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "localreach",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.workers.scraper_tasks",
        "app.workers.outreach_tasks",
        "app.workers.followup_tasks",
        "app.workers.geogrid_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.workers.scraper_tasks.*": {"queue": "scraping"},
        "app.workers.outreach_tasks.*": {"queue": "outreach"},
        "app.workers.followup_tasks.*": {"queue": "followups"},
        "app.workers.geogrid_tasks.*": {"queue": "geogrid"},
    },
    beat_schedule={
        "process-followups-every-5-min": {
            "task": "app.workers.followup_tasks.process_followups",
            "schedule": crontab(minute="*/5"),
        },
        "reset-whatsapp-daily-count": {
            "task": "app.workers.outreach_tasks.reset_daily_counts",
            "schedule": crontab(hour=0, minute=0),
        },
    },
)
