import logging
import re

from flask import jsonify, request

from config import VERSION_PATTERN

logger = logging.getLogger(__name__)


def register_routes(app, get_model):
    @app.route("/model/load", methods=["GET"])
    def load_model():
        version = request.args.get("version")
        if not version:
            return jsonify({"error": "'version' argument missing."}), 400
        if not re.match(VERSION_PATTERN, version):
            return jsonify({"error": "Invalid version format. Expected YYYY-MM-DD."}), 400
        model = get_model(version=version)
        if model is None:
            return jsonify({"error": f"Failed to load model version '{version}'"}), 503
        return jsonify({"model": model.version}), 200

    @app.route("/model/version", methods=["GET"])
    def model_version():
        model = get_model()
        version = model.version if model else None
        return jsonify({"model": version}), 200
