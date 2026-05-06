from flask import Flask, jsonify, request
from prometheus_client import make_wsgi_app, Counter, Histogram, Gauge
from werkzeug.middleware.dispatcher import DispatcherMiddleware
import time
from tracing import setup_tracing

app = Flask(__name__)
tracer = setup_tracing(app, 'data-processor')

REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP Requests', ['method', 'path', 'status', 'job'])
REQUEST_LATENCY = Histogram('http_duration_seconds', 'HTTP Request Latency', ['method', 'path', 'status', 'job'])

@app.before_request
def before_request():
    if request.path != '/metrics':
        request.start_time = time.time()

@app.after_request
def after_request(response):
    if request.path != '/metrics':
        latency = time.time() - getattr(request, 'start_time', time.time())
        REQUEST_COUNT.labels(request.method, request.path, response.status_code, 'python-processor').inc()
        REQUEST_LATENCY.labels(request.method, request.path, response.status_code, 'python-processor').observe(latency)
    return response

app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {
    '/metrics': make_wsgi_app()
})

@app.route('/health')
def health():
    return jsonify(status="UP", service="data-processor"), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
