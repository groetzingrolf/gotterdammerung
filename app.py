import os

from flask import Flask
import redis


redis_url = os.getenv("REDISTOGO_URL", "redis://localhost:6379")
redis = redis.from_url(redis_url)
app = Flask(__name__)


@app.route("/")
def hello():
    count = int(redis.get("count") or 0)
    count += 1
    redis.set("count", count)
    return "Hello %d" % count


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
