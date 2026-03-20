import logging
from flask import request, jsonify

logger = logging.getLogger(__name__)


def register_routes(app, get_model):
    @app.route("/model/load", methods=["GET"])
    def load_model():
        version = request.args.get("version")
        if not version:
            return jsonify({"error": "'version' argument missing."}), 400
        model = get_model(version=version)
        return jsonify({"model": model.version}), 200

    @app.route("/model/version", methods=["GET"])
    def model_version():
        model = get_model()
        version = model.version if model else None
        return jsonify({"model": version}), 200
