import logging

from flask import request

from . import health, inference, model

logger = logging.getLogger(__name__)


def register_all_routes(app, get_model):
    @app.before_request
    def log_request():
        if request.path != "/favicon.ico":
            logger.info("%s %s", request.method, request.path)

    health.register_routes(app)
    model.register_routes(app, get_model)
    inference.register_routes(app, get_model)
