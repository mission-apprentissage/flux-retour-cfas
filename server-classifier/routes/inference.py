import logging
from flask import request, jsonify

logger = logging.getLogger(__name__)


def register_routes(app, get_model):
    @app.route("/model/score", methods=["POST"])
    def score():
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        request_data = request.get_json()
        version = request_data.get("version")
        model = get_model(version)
        data = request_data.get("data")
        result = model.score(data)
        return jsonify(result), 200
