# Use a lightweight Python image
FROM python:3.10-slim

# Create a user to avoid running as root
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy and install requirements
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the rest of the app
COPY --chown=user . .

# IMPORTANT: Hugging Face uses port 7860 by default
EXPOSE 7860

# Run using Gunicorn or Uvicorn (adjust app:app to your filename:variable)
CMD ["gunicorn", "-b", "0.0.0.0:7860", "app:app"]