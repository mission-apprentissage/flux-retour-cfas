import os
import sys
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from flask import Flask

from routes import register_all_routes
from routes.health import register_routes

# --- Health routes ---


@pytest.fixture
def health_app():
    app = Flask(__name__)
    register_routes(app)
    return app


@pytest.fixture
def health_client(health_app):
    return health_app.test_client()


def test_health_endpoint(health_client):
    response = health_client.get("/")
    assert response.status_code == 200
    data = response.get_json()
    assert "status" in data
    assert "version" in data


def test_favicon_returns_204(health_client):
    response = health_client.get("/favicon.ico")
    assert response.status_code == 204


# --- Full app with inference routes ---

VALID_ITEM = {
    "apprenant.date_de_naissance": "2002-07-28T00:00:00.000Z",
    "formation.date_inscription": "2025-11-10T00:00:00.000Z",
    "formation.date_fin": "2027-05-09T00:00:00.000Z",
    "formation.date_entree": "2025-11-10T00:00:00.000Z",
    "contrat.date_debut": "2025-11-10T00:00:00.000Z",
    "contrat.date_fin": "2027-05-09T00:00:00.000Z",
    "contrat.date_rupture": "2025-12-15T00:00:00.000Z",
}


def make_mock_model(version="contact-2026-03-16"):
    model = MagicMock()
    model.version = version
    model.score.return_value = {"model": version, "scores": [0.85]}
    return model


@pytest.fixture
def full_app():
    mock_model = make_mock_model()

    def get_model(version=None):
        if version is None:
            return mock_model
        if version == mock_model.version or version is None:
            return mock_model
        return None

    app = Flask(__name__)
    register_all_routes(app, get_model)
    return app


@pytest.fixture
def client(full_app):
    return full_app.test_client()


# --- /model/score validation ---


def test_score_valid_request(client):
    response = client.post("/contact/score", json={"data": [VALID_ITEM]})
    assert response.status_code == 200
    data = response.get_json()
    assert "model" in data
    assert "scores" in data


def test_score_rejects_non_json(client):
    response = client.post("/contact/score", data="not json", content_type="text/plain")
    assert response.status_code == 400
    assert "JSON" in response.get_json()["error"]


def test_score_rejects_empty_data(client):
    response = client.post("/contact/score", json={"data": []})
    assert response.status_code == 400
    assert "'data'" in response.get_json()["error"]


def test_score_rejects_missing_data(client):
    response = client.post("/contact/score", json={})
    assert response.status_code == 400


def test_score_rejects_non_list_data(client):
    response = client.post("/contact/score", json={"data": "not a list"})
    assert response.status_code == 400


def test_score_rejects_missing_fields(client):
    incomplete_item = {"apprenant.date_de_naissance": "2002-07-28T00:00:00.000Z"}
    response = client.post("/contact/score", json={"data": [incomplete_item]})
    assert response.status_code == 400
    assert "missing fields" in response.get_json()["error"]


def test_score_rejects_non_object_in_data(client):
    response = client.post("/contact/score", json={"data": ["not an object"]})
    assert response.status_code == 400
    assert "must be an object" in response.get_json()["error"]


def test_score_rejects_invalid_version_format(client):
    response = client.post("/contact/score", json={"data": [VALID_ITEM], "version": "invalid"})
    assert response.status_code == 400
    assert "version" in response.get_json()["error"].lower()


def test_score_rejects_batch_exceeding_max():
    mock_model = make_mock_model()
    app = Flask(__name__)

    with patch("routes.inference.MAX_BATCH_SIZE", 2):
        register_all_routes(app, lambda v=None: mock_model)
        test_client = app.test_client()
        response = test_client.post("/contact/score", json={"data": [VALID_ITEM, VALID_ITEM, VALID_ITEM]})
        assert response.status_code == 400
        assert "maximum" in response.get_json()["error"].lower()


# --- Authentication ---


@patch("routes.CLASSIFIER_API_KEY", "test-secret-key")
def test_auth_rejects_missing_api_key():
    mock_model = make_mock_model()
    app = Flask(__name__)
    register_all_routes(app, lambda v=None: mock_model)
    client = app.test_client()

    response = client.post("/contact/score", json={"data": [VALID_ITEM]})
    assert response.status_code == 401


@patch("routes.CLASSIFIER_API_KEY", "test-secret-key")
def test_auth_rejects_wrong_api_key():
    mock_model = make_mock_model()
    app = Flask(__name__)
    register_all_routes(app, lambda v=None: mock_model)
    client = app.test_client()

    response = client.post("/contact/score", json={"data": [VALID_ITEM]}, headers={"X-API-Key": "wrong-key"})
    assert response.status_code == 401


@patch("routes.CLASSIFIER_API_KEY", "test-secret-key")
def test_auth_accepts_correct_api_key():
    mock_model = make_mock_model()
    app = Flask(__name__)
    register_all_routes(app, lambda v=None: mock_model)
    client = app.test_client()

    response = client.post("/contact/score", json={"data": [VALID_ITEM]}, headers={"X-API-Key": "test-secret-key"})
    assert response.status_code == 200


@patch("routes.CLASSIFIER_API_KEY", "test-secret-key")
def test_auth_skipped_on_health_endpoint():
    app = Flask(__name__)
    register_all_routes(app, lambda v=None: None)
    client = app.test_client()

    response = client.get("/")
    assert response.status_code == 200
