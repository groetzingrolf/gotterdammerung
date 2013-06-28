var SG_KEY = "NjkwMjR8MTM3MjM2MjU1OA";

var loc = null;
var type = "all";
var search_date = Date.today();
search_date = search_date.getFullYear() + "-" + (search_date.getMonth() + 1) + "-" + search_date.getDate();

COL_WIDTH = 200;
PADDING = 5;
IMG_WIDTH = COL_WIDTH - 2 * PADDING;

function build_card (score, type, event_name, event_venue, event_image, callback, event_url, movie_info) {
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

        var expanded = $("<div class='event-info-expanded'>");
        if(event_name) {
            expanded.append($("<h3>").text(event_name));
        } else if(movie_info) {
            console.log(movie_info);
            expanded.append($("<h3>").text(movie_info.name));
        }
        if(event_venue) {
            expanded.append($("<p>").text(event_venue));
        } else if(movie_info) {
            expanded.append($("<p>").text("RT: " + movie_info.score + "%"));
        }
        if(event_url) {
            expanded.append($("<a target='_blank' href='" + event_url + "'>").text("GET TICKETS"));
        } else if(movie_info) {
            var movie_url = "http://www.google.com/movies?near=" + encodeURIComponent($('#filter-location').text()) + "&q=" + movie_info.name;
            expanded.append($("<a target='_blank' href='" + movie_url + "'>").text("GET TICKETS"));
        }

        var flipped = $("<div>").addClass("event").addClass("flipped").css("width", width).css("height", height);
        flipped.append(expanded);

        var flipper = $("<div>").addClass("flipper");
        flipper.append(front);
        flipper.append(flipped);

        var card = $("<div>").addClass("flip-container").addClass(type).css("width", width).css("height", height).attr("data-score", score);
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
        build_card(Math.max(movie.score - 30, 0), "movies", null, null, movie.image, add_card, null, movie);
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
        return false;
    }
    $("#location").show();

    for (var i = 0; i < data.events.length; i += 1) {
        var event = data.events[i];
        var image = null;
        for (var j = 0; j < event.performers.length; j += 1) {
            if (event.performers[j].image) {
                image = event.performers[j].image;
                if (event.performers[j].images.mongo) {
                    image = event.performers[j].images.mongo;
                }
                break;
            }
        }
        if (!image) {
            continue;
        }
        var type = "concerts";
        if (event.taxonomies[0].name == "theater") {
            type = "theater";
        } else if (event.taxonomies[0].name == "sports") {
            type = "games";
        }
        build_card(100 * event.score, type, event.title, event.venue.name, image, add_card, event.url);
    }
    return true
}

function seatgeek_data_location (data) {
    if (seatgeek_data(data)) {
        if (!loc || loc.postal_code != data.meta.geolocation.postal_code) {
            loc = data.meta.geolocation;

            // Something this hacky deserves a hacky variable name
            var resizer2 = $("#hidden-resizer2");
            resizer2.text(loc.display_name);
            $("#filter-location").text(loc.display_name).width(resizer2.outerWidth(true) - 16);
            load_movies();
        }
    }
}

// If have_location is false we need to do SG request first to get location info, then the rest.
function reloadEvents(have_location, lat, lon) {
    $("#container").isotope("remove", $(".flip-container"));
    var callback = "seatgeek_data_location";
    if (have_location) {
        callback = "seatgeek_data";
    }

    if (loc && !lat) {
        lat = loc.lat;
        lon = loc.lon;
    }
    var url = "http://api.seatgeek.com/2/events?datetime_local=" + search_date + "&per_page=1000&sort=score.desc&client_id=" + SG_KEY;
    if (lat) {
        url += "&lat=" + lat + "&lon=" + lon;
    } else {
        url += "&geoip=true";
    }
    $.ajax({
        url: url,
        dataType: 'jsonp',
        jsonp: 'callback',
        jsonpCallback: callback,
    });

    if (have_location) {
        load_movies();
    }
}

function init () {
    $('#container').isotope({
      // options
        itemSelector : '.flip-container',
        layoutMode : 'perfectMasonry',
        perfectMasonry: {
            columnWidth: COL_WIDTH,
            rowHeight: COL_WIDTH,
        },
        getSortData: {
            score: function($elem) {
                return parseFloat($elem.attr("data-score"));
            }
        },
        sortBy: "score",
        sortAscending: false,
    });

	$('.overlay').hover(function() {
		$(this).animate({ opacity: 0.17 });
	}, function() {
		$(this).animate({ opacity: 0 });
	});

    reloadEvents(false, null, null);

    function showTypes() {
        $("#container").animate({ top: '+=20' }, function() {
            $('#type-select').fadeIn(function() {
                $('#type-select ul').show().addClass('lightSpeedIn');
            });
        });
        $('#filter-type').unbind('click').click(hideTypes);
    }
    function hideTypes() {
        $('#type-select').fadeOut(function () {
            $("#container").animate({ top: '-=20' });
        });
        $('#filter-type').unbind('click').click(showTypes);
    }
    $('#filter-type').click(showTypes);

    $('#type-select .choice').click(function() {
        var choice = $(this).attr("data-choice");
        var verb = $(this).attr("data-verb");
        var choice_display = choice.replace(/^./, function (char) {
            return char.toUpperCase();
        });
        $("#filter-type").text(choice_display);
        $(".verb").text(verb);
        $("#type-select li.active").removeClass("active");
        $(this).parent().addClass("active");
        hideTypes();
        if (choice == "everything") {
            choice = "";
        } else {
            choice = "." + choice;
        }
        $("#container").isotope({ filter: choice });
        return false;
    });
    var old_time;
    $('#filter-time').click(function() {
        old_time = $(this).text();
        $(this).html("&nbsp;").width(200);
        $('#filter-time-input').val("");
        $('#filter-time-input-wrap').show().css({'left': $('#filter-time').position().left - 7});;
        $('#filter-time-input').focus();
    });
    $("#filter-time-input").keyup(function(e) {
        if (e.which == 13) { // Enter key
            $(this).blur();
        }
    });
    $('#filter-time-input').blur(function() {
        var new_date = Date.parse($(this).val());
        var val = old_time;

        if (new_date) {
            new_search_date = new_date.getFullYear() + "-" + (new_date.getMonth() + 1) + "-" + new_date.getDate();
            // Only compute if different and in future
            if (new_search_date != search_date) {
                var today =  Date.today();
                if (new_date.getTime() - today.getTime() >= 0) {
                    console.log("future");
                    search_date = new_search_date;
                    reloadEvents(true, null, null);
                    val = displayDate(new_date);
                }
            }
        }
        // Something this hacky deserves a hacky variable name
        var resizer2 = $("#hidden-resizer2");
        resizer2.text(val);
        $(this).parent().hide();
        $("#filter-time").text(val).width(resizer2.outerWidth(true) - 16);
    });
    $('#filter-location').click(function() {
        $(this).html("&nbsp;").width(300).css({'display': 'inline-block'});
        $('#filter-location-input-wrap').show().css({'left': $('#filter-location').position().left - 7});
        $('#filter-location-input').focus();
    });
    $('#filter-location-input').blur(function() {
        $('#filter-location-input').unbind().bind("geocode:result", function(event, result){
            var lat = result.geometry.location.lat();
            var lon = result.geometry.location.lng();
            reloadEvents(false, lat, lon);
            // Something this hacky deserves a hacky variable name
            var resizer2 = $("#hidden-resizer2");
            resizer2.text($(this).val());
            $("#filter-location").text($(this).val()).width(resizer2.outerWidth(true) - 16);
            $(this).parent().hide();
        });
    });
    $('#filter-location').click(function() {
        $(this).html("&nbsp;").width(300).css({'display': 'inline-block'});
        $('#filter-location-input').val("");
        $('#filter-location-input-wrap').show();
        $('#filter-location-input').focus();
    });
    $('#filter-location-input').geocomplete();
}

function displayDate (new_date) {
    var one_day = 1000 * 60 * 60 * 24;
    var today =  Date.today();
    var days = Math.ceil((new_date.getTime() - today.getTime()) / one_day);

    if (days == 0) {
        return "today";
    } else if (days == 1) {
        return "tomorrow";
    }else {
        var ret = new_date.toString("dddd, MMMM d");
        if (new_date.getFullYear() > today.getFullYear()) {
            ret += ", " + new_date.getFullYear();
        }
        return ret
    }
}

$(init);
