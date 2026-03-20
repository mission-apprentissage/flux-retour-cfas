import logging
import re

from flask import jsonify, request

from config import VERSION_PATTERN

logger = logging.getLogger(__name__)


def register_routes(app, get_model):
    @app.route("/model/score", methods=["POST"])
    def score():
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        request_data = request.get_json()
        version = request_data.get("version")
        if version is not None and not re.match(VERSION_PATTERN, version):
            return jsonify({"error": "Invalid version format. Expected YYYY-MM-DD."}), 400
        model = get_model(version)
        if model is None:
            return jsonify({"error": "Model not available"}), 503
        data = request_data.get("data")
        result = model.score(data)
        return jsonify(result), 200
