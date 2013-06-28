var SG_KEY = "NjkwMjR8MTM3MjM2MjU1OA";

var loc = null;
var type = "all";
var search_date = new Date();
search_date = search_date.getFullYear() + "-" + (search_date.getMonth() + 1) + "-" + search_date.getDate();

COL_WIDTH = 200;
PADDING = 5;
IMG_WIDTH = COL_WIDTH - 2 * PADDING;

function build_card (score, event_name, event_venue, event_image, callback) {
    var img = new Image();
    $(img).load(function() {
        var width = this.width;
        var height = this.height;

        /* Some movie posters are huge and slow down the page quite a bit. */
        if (width > 1000 || height > 1000) {
            return;
        }

        /* Too small for a column. */
        if (width < IMG_WIDTH || height < IMG_WIDTH) {
            return;
        }

        var width_mul = Math.min(2, Math.floor(Math.random() * Math.floor(width / IMG_WIDTH)));
        var height_mul = Math.min(3, Math.floor(Math.random() * Math.floor(height / IMG_WIDTH)));
        width = width_mul * COL_WIDTH + IMG_WIDTH;
        height = height_mul * COL_WIDTH + IMG_WIDTH;

        // Determine what the largest possible size is that we can use for the
        // h3 text to keep it on one line
        var size = 28;
        var desired_width = width - 50;
        var resizer = $("#hidden-resizer");
        resizer.css("font-size", 28);

        resizer.html(event_name);

        while((resizer.width() > desired_width) && (size > 19)) {
          size = parseInt(resizer.css("font-size"), 10);
          resizer.css("font-size", size - 1);
        }
        size = parseInt(resizer.css("font-size"), 10);
        console.log(size);
        $("#target-location").css("font-size", size).html(resizer.html());

        var front = $("<div>").addClass("event").addClass("front").css("width", width).css("height", height);

        if (event_name) {
            var event_info = $("<div>").addClass("event-info");
            event_info.append($("<h3>").text(event_name).css("font-size", size));
            if (event_venue) {
                event_info.append($("<h4>").text(event_venue));
            }
            front.append(event_info);
        }
        front.append($("<div>").addClass("overlay"));
        front.append($("<div>").addClass("img-div").css("background-image", "url('" + event_image + "')").css("width", width).css("height", height));

        var expanded = $("<div>");
        expanded.append($("<h3>").text(event_name));

        var flipped = $("<div>").addClass("event").addClass("flipped").css("width", width).css("height", height);
        flipped.append(expanded);

        var flipper = $("<div>").addClass("flipper");
        flipper.append(front);
        flipper.append(flipped);

        var card = $("<div>").addClass("flip-container").css("width", width).css("height", height).attr("data-score", score);
        card.append(flipper);

        callback(card);
    });
    img.src = event_image;
}

function add_card(card) {
    $('#container').isotope('insert', card);
//    $('#container').append(card);
}

function movie_data(data) {
    for (var i = 0; i < data.movies.length; i += 1) {
        var movie = data.movies[i];
        build_card(Math.max(movie.score - 40, 0), null, null, movie.image, add_card);
    }
}

function load_movies () {
    if (!loc || !loc.postal_code) {
        alert("missing location information");
        return;
    }
    $.ajax({
        url: "/movies?zip=" + loc.postal_code + "&date=" + search_date,
        success: movie_data
    });
}

function seatgeek_data (data) {
    if (!data || !data.meta || !data.meta.geolocation) {
        alert("SG API issue.");
        return;
    }
    if (!loc || loc.postal_code != data.meta.geolocation.postal_code) {
        loc = data.meta.geolocation;
        $("#filter-location").text(loc.display_name);
        load_movies();
    }

    $("#location").show();

    $('#container').isotope({
      // options
        itemSelector : '.flip-container',
        layoutMode : 'masonry',
        masonry: {
            columnWidth: COL_WIDTH,
            gutterWidth: PADDING,
        },
        getSortData: {
            score: function($elem) {
                return parseFloat($elem.attr("data-score"));
            }
        },
        sortBy: "score",
        sortAscending: false,
    });

    for (var i = 0; i < data.events.length; i += 1) {
        var event = data.events[i];
        var image = null;
        for (var j = 0; j < event.performers.length; j += 1) {
            if (event.performers[j].image) {
                image = event.performers[j].image;
                if (event.performers[j].images.mongo && Math.random() < 0.3) {
                    image = event.performers[j].images.mongo;
                }
                break;
            }
        }
        if (!image) {
            continue;
        }
        build_card(100 * event.score, event.title, event.venue.name, image, add_card);
    }
}

function init () {
	$('.overlay').hover(function() {
		$(this).animate({ opacity: 0.17 });
	}, function() {
		$(this).animate({ opacity: 0 });
	});

    var url = "http://api.seatgeek.com/2/events?datetime_local=" + search_date + "&geoip=true&per_page=100&sort=score.desc&client_id=" + SG_KEY;
    $.ajax({
        url: url,
        dataType: 'jsonp',
        jsonp: 'callback',
        jsonpCallback: "seatgeek_data"
      });

    $('#filter-type').click(function() {
        $("#container").transition({ y: '35px' }, function() {
            $('#type-select').fadeIn();
        });
    });
}

$(init);
