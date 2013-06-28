var SG_KEY = "NjkwMjR8MTM3MjM2MjU1OA";

var loc = null;
var type = "all";
var search_date = new Date();

function build_card (event_name, event_venue, event_image, width, height) {
    var event_info = $("<div>").addClass("event-info");
    event_info.append($("<h3>").text(event_name));
    event_info.append($("<h4>").text(event_venue));

    var card = $("<div>").addClass("event").css("width", width).css("height", height);
    card.append(event_info);
    card.append($("<div>").addClass("overlay"));
    card.append($("<img>").attr("src", event_image).attr("width", width).attr("height", height));

    return card;
}

function seatgeek_data (data) {
    if (!data || !data.meta || !data.meta.geolocation) {
        alert("SG API issue.")
    }
    loc = data.meta.geolocation;
    $("#filter-location").text(loc.display_name);
    $("#location").show();

    for (var i = 0; i < data.events.length; i += 1) {
        var event = data.events[i];
        var image = null;
        var w = null;
        var h = null
        for (var j = 0; j < event.performers.length; j += 1) {
            if (event.performers[j].image) {
                image = event.performers[j].image;
                w = 280;
                h = 210;
                if (event.performers[j].images.mongo && Math.random() < 0.3) {
                    image = event.performers[j].images.mongo;
                    w = 640;
                    h = 270;
                }
                break;
            }
        }
        if (!image) {
            continue;
        }
        var card = build_card(event.title, event.venue.name, image, w, h);
        $("#container").append(card);
    }
}

function init () {
	$('.overlay').hover(function() {
		$(this).animate({ opacity: 0.17 });
	}, function() {
		$(this).animate({ opacity: 0 });
	});

    var d = search_date.getFullYear() + "-" + (search_date.getMonth() + 1) + "-" + search_date.getDate();
    var url = "http://api.seatgeek.com/2/events?datetime_local=" + d + "&geoip=true&per_page=100&client_id=" + SG_KEY;
    $.ajax({
        url: url,
        dataType: 'jsonp',
        jsonp: 'callback',
        jsonpCallback: "seatgeek_data"
      });
}

$(init);
