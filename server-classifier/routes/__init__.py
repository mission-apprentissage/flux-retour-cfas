import hmac
import logging

from flask import jsonify, request

from config import CLASSIFIER_API_KEY

from . import health, inference, model

logger = logging.getLogger(__name__)


def register_all_routes(app, get_model):
    @app.before_request
    def authenticate():
        if request.path in ("/", "/favicon.ico"):
            return None
        if not CLASSIFIER_API_KEY:
            return None
        api_key = request.headers.get("X-API-Key", "")
        if not hmac.compare_digest(api_key, CLASSIFIER_API_KEY):
            return jsonify({"error": "Unauthorized"}), 401

    @app.before_request
    def log_request():
        if request.path != "/favicon.ico":
            logger.info("%s %s", request.method, request.path)

    health.register_routes(app)
    model.register_routes(app, get_model)
    inference.register_routes(app, get_model)
