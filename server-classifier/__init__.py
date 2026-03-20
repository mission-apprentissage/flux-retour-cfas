import logging

from flask import Flask, jsonify

from model_manager import get_model, load_latest_model
from routes import register_all_routes

logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)

    if __name__ != "__main__":
        gunicorn_logger = logging.getLogger("gunicorn.error")
        app.logger.handlers = gunicorn_logger.handlers
        app.logger.setLevel(gunicorn_logger.level)

    load_latest_model()
    register_all_routes(app, get_model)

    @app.errorhandler(Exception)
    def handle_exception(e):
        app.logger.error("Unhandled exception: %s", e, exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

    return app
