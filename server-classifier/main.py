import logging
import os

from dotenv import load_dotenv

from __init__ import create_app

load_dotenv()


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
        handlers=[logging.StreamHandler()],
    )


port = int(os.getenv("LAB_SERVER_PORT", 8000))
setup_logging()
app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port)
