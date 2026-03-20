import logging

from flask import jsonify

from config import PUBLIC_VERSION

logger = logging.getLogger(__name__)


def register_routes(app):
    @app.route("/favicon.ico")
    def favicon():
        return "", 204

    @app.route("/")
    def api_ready():
        return jsonify({"status": "TBA classifier API ready.", "version": PUBLIC_VERSION})
