from flask import Flask, jsonify
import time

app = Flask(__name__)
start_time = time.time()

@app.route('/health')
def health():
    return jsonify(status="UP", service="data-processor"), 200

@app.route('/metrics')
def metrics():
    uptime = time.time() - start_time
    return f'python_uptime_seconds {uptime}\npython_info{{version="3.11"}} 1\n', 200, {'Content-Type': 'text/plain'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
