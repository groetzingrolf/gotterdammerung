import datetime
import json
import os

from BeautifulSoup import BeautifulSoup
from flask import (request,
                   Flask,
                   Response)
from repoze.lru import lru_cache
import requests
import requests.exceptions


ROTTEN_TOMATOES_KEY = "exr5fbr3d23vvjtdnb6tjpgb"


app = Flask(__name__)


def respond(doc, status=200):
    doc["status"] = status
    return Response(json.dumps(doc), mimetype="application/json")


def error(status, message):
    return respond({"message": message}, status)


@app.route("/")
def index():
    return "Hello World!"


@lru_cache(maxsize=128)
def _film_info(film_id):
    url = "http://api.rottentomatoes.com/api/public/v1.0/movies/%s.json?apikey=%s" % (film_id, ROTTEN_TOMATOES_KEY)
    try:
        res = requests.get(url, timeout=2)
    except requests.exceptions.Timeout:
        return None
    return json.loads(res.text)


@lru_cache(maxsize=2000)
def _movies(zip, date):
    print "running"
    date = date.strftime("%Y%m%d")
    url = "http://igoogle.flixster.com/igoogle/showtimes?movie=all&date=%s&postal=%s" % (date, zip)
    try:
        res = requests.get(url, timeout=0.5)
    except requests.exceptions.Timeout:
        return [], "Timeout connecting to flixster"

    soup = BeautifulSoup(res.text)

    result = {}
    for theater in soup.findAll("div", "theater"):
        theater_name = theater.find("h2").find("a").text

        theater_address = theater.find("h2").find("span").text
        _, _, theater_address = theater_address.partition("-")
        theater_address, _, _ = theater_address.partition("-Map-")
        theater_address = theater_address.strip()

        for film in theater.findAll("div", "showtime"):
            _, _, film_id = film.find("h3").find("a")["href"].rpartition("/")
            film_title = film.find("h3").find("a").text
            showtimes = [a.text for a in film.find("h3").findNextSiblings("a")]
            if not showtimes:
                showtimes = [x.strip().replace("&nbsp;", "") for x in film.find("h3").nextSibling.split()]
            if film_id not in result:
                film_info = _film_info(film_id)
                if not film_info:
                    continue
                result[film_id] = {"name": film_title,
                                   "image": film_info["posters"]["original"],
                                   "score": film_info["ratings"]["critics_score"],
                                   "theaters": []}
            result[film_id]["theaters"].append({"name": theater_name,
                                                "address": theater_address,
                                                "showtimes": showtimes})

    return sorted(result.values(), key=lambda x: x["score"], reverse=True), "Success"


@app.route("/movies")
def movies():
    if "zip" not in request.args:
        return error(400, "Missing required param 'zip'")
    zip = request.args["zip"]

    if "date" not in request.args:
        return error(400, "Missing required param 'date'")
    date = request.args["date"]

    date = datetime.date(*map(int, date.split("-")))
    today = datetime.date.today()
    if date < today:
        return error(400, "Date is in the past.")

    if date > today + datetime.timedelta(days=7):
        movies, message = [], "Date too far in the future"
    else:
        movies, message = _movies(zip, date)

    return respond({"movies": movies, "message": message})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
