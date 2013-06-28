var SG_KEY = "NjkwMjR8MTM3MjM2MjU1OA";

var loc = null;
var type = "all";
var search_date = new Date();
search_date = search_date.getFullYear() + "-" + (search_date.getMonth() + 1) + "-" + search_date.getDate();

function build_card (event_name, event_venue, event_image, callback) {
    var img = new Image();
    $(img).load(function() {
        var width = this.width;
        var height = this.height;
        if (width < height && width > 300) {
            height = height * 300 / width;
            width = 300;
        } else if (height < width && height > 300) {
            width = width * 300 / height;
            height = 300;
        }

        var event_info = $("<div>").addClass("event-info");
        event_info.append($("<h3>").text(event_name));
        if (event_venue) {
            event_info.append($("<h4>").text(event_venue));
        }

        var card = $("<div>").addClass("event").css("width", width).css("height", height);
        card.append(event_info);
        card.append($("<div>").addClass("overlay"));
        card.append($("<img>").attr("src", event_image).attr("width", width).attr("height", height));

        callback(card);
    });
    img.src = event_image;
}

function add_card(card) {
    $('#container').isotope('insert', card);
}

function movie_data(data) {
    for (var i = 0; i < data.movies.length; i += 1) {
        var movie = data.movies[i];
        build_card(movie.name, null, movie.image, add_card);
    }
}

function load_movies () {
    if (!loc || !loc.postal_code) {
        alert("missing location information");
        return;
    }
    $.ajax({
        url: "/movies?zip=" + loc.postal_code + "&date=" + search_date,
        success: movie_data,
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
      itemSelector : '.event',
      layoutMode : 'fitRows'
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
        build_card(event.title, event.venue.name, image, add_card);
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
}

$(init);
