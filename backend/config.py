from dotenv import load_dotenv
import os

load_dotenv()

BACKEND_PORT = int(os.getenv("BACKEND_PORT", 8000))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

FETCH_INTERVAL_SECONDS = int(os.getenv("FETCH_INTERVAL_SECONDS", 60))
FAST_FETCH_INTERVAL_SECONDS = int(os.getenv("FAST_FETCH_INTERVAL_SECONDS", 30))

TOP_N = int(os.getenv("TOP_N", 10))
DETAILED_TOP_N = int(os.getenv("DETAILED_TOP_N", 30))
