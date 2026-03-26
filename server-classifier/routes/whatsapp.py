import logging
import re

from flask import jsonify, request

from config import MAX_BATCH_SIZE, VERSION_PATTERN

logger = logging.getLogger(__name__)

def register_routes(app, get_model):
    @app.route("/whatsapp/load", methods=["GET"])
    def load_model():
        version = request.args.get("version")
        if not version:
            return jsonify({"error": "'version' argument missing."}), 400
        if not re.match(VERSION_PATTERN, version):
            return jsonify({"error": "Invalid version format. Expected YYYY-MM-DD."}), 400
        model = get_model(origin="whatsapp", version=version)
        if model is None:
            return jsonify({"error": f"Failed to load model version '{version}'"}), 503
        return jsonify({"model": model.version}), 200

    @app.route("/whatsapp/version", methods=["GET"])
    def model_version():
        model = get_model(origin="whatsapp")
        version = model.version if model else None
        return jsonify({"model": version}), 200
    
    @app.route("/whatsapp/score", methods=["POST"])
    def score():
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        request_data = request.get_json()
        version = request_data.get("version")
        if version is not None and not re.match(VERSION_PATTERN, version):
            return jsonify({"error": "Invalid version format. Expected YYYY-MM-DD."}), 400
        model = get_model(origin="whatsapp", version=version)
        if model is None:
            return jsonify({"error": "Model not available"}), 503
        data = request_data.get("data")
        if not isinstance(data, list) or len(data) == 0:
            return jsonify({"error": "'data' must be a non-empty array"}), 400
        if len(data) > MAX_BATCH_SIZE:
            return jsonify({"error": f"Batch size exceeds maximum of {MAX_BATCH_SIZE}"}), 400
        required_fields = [
            "apprenant.date_de_naissance",
            "formation.date_inscription",
            "formation.date_fin",
            "formation.date_entree",
            "contrat.date_debut",
            "contrat.date_fin",
            "contrat.date_rupture",
        ]
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                return jsonify({"error": f"data[{i}] must be an object"}), 400
            missing = [f for f in required_fields if f not in item]
            if missing:
                return jsonify({"error": f"data[{i}] missing fields: {missing}"}), 400
        result = model.score(data)
        return jsonify(result), 200
