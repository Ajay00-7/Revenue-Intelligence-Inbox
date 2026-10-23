# Use official Python slim image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install build dependencies (if any)
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Copy only requirements first for caching
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend source
COPY backend/ ./

# Expose the port FastAPI will run on
EXPOSE 8000

# Default command to start the server
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
