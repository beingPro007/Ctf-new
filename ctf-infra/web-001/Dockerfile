FROM python:3.11-alpine
WORKDIR /app
RUN pip install flask --no-cache-dir
COPY app.py .
EXPOSE 5001
CMD ["python", "app.py"]
