import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from flask import Flask

from routes.health import register_routes


@pytest.fixture
def app():
    app = Flask(__name__)
    register_routes(app)
    return app


@pytest.fixture
def client(app):
    return app.test_client()


def test_health_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.get_json()
    assert "status" in data
    assert "version" in data


def test_favicon_returns_204(client):
    response = client.get("/favicon.ico")
    assert response.status_code == 204
