var api_key = 'API_KEY_HERE',
    timeout;
var addEvent=function(){return document.addEventListener?function(a,c,d){if(a&&a.nodeName||a===window)a.addEventListener(c,d,!1);else if(a&&a.length)for(var b=0;b<a.length;b++)addEvent(a[b],c,d)}:function(a,c,d){if(a&&a.nodeName||a===window)a.attachEvent("on"+c,function(){return d.call(a,window.event)});else if(a&&a.length)for(var b=0;b<a.length;b++)addEvent(a[b],c,d)}}();
var JSONP = (function(){
	var counter = 0, head, window = this, config = {};
	function load(url, pfnError) {
		var script = document.createElement('script'),
			done = false;
		script.src = url;
		script.async = true;
 
		var errorHandler = pfnError || config.error;
		if ( typeof errorHandler === 'function' ) {
			script.onerror = function(ex){
				errorHandler({url: url, event: ex});
			};
		}

		script.onload = script.onreadystatechange = function() {
			if ( !done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") ) {
				done = true;
				script.onload = script.onreadystatechange = null;
				if ( script && script.parentNode ) {
					script.parentNode.removeChild( script );
				}
			}
		};

		if ( !head ) {
			head = document.getElementsByTagName('head')[0];
		}
		head.appendChild( script );
	}
	function encode(str) {
		return encodeURIComponent(str);
	}
	function jsonp(url, params, callback, callbackName) {
		var query = (url||'').indexOf('?') === -1 ? '?' : '&', key;

		callbackName = (callbackName||config['callbackName']||'callback');
		var uniqueName = callbackName + "_json" + (++counter);

		params = params || {};
		for ( key in params ) {
			if ( params.hasOwnProperty(key) ) {
				query += encode(key) + "=" + encode(params[key]) + "&";
			}
		}	

		window[ uniqueName ] = function(data){
			callback(data);
			try {
				delete window[ uniqueName ];
			} catch (e) {}
			window[ uniqueName ] = null;
		};
 
		load(url + query + callbackName + '=' + uniqueName);
		return uniqueName;
	}
	function setDefaults(obj){
		config = obj;
	}
	return {
		get:jsonp,
		init:setDefaults
	};
}());
var wrap = function(tag, text, opts) {
    wrapped = '<'+tag;
    if (opts) {
        for (opt in opts) {
            wrapped += ' '+opt+'="'+opts[opt]+'"';
        }
    }
    wrapped += '>'+text+'</'+tag+'>';
    return wrapped;
};
var message = function(msg) {
    document.getElementById('message').innerHTML = msg;
};
  
if ('geolocation' in navigator && 'querySelector' in document) {
    function get_location() {
        message(wrap('p', 'Trying to find you&hellip;')+wrap('h1', 'Loading', {'class': 'loading'}));
        // Request the geolocation
        navigator.geolocation.getCurrentPosition(forecast, location_error);
    };
    function location_error(err) {
        if (err.code == 1) { // User denied access
            message(wrap('p', 'Oh noes! We needed your location.'));
        } else { // Location unavailable
            message(wrap('p', 'Oh noes! We couldn&rsquo;t find you.') + wrap('p', wrap('a', 'Try again', {'href': '#', 'class': 'retry'}))); 
        }
    };
    function forecast(position) {
        var lat = position.coords.latitude.toFixed(2),
            lon = position.coords.longitude.toFixed(2);
        // Do we have this forecast in the cache?
        var data = get_forecast_cache(lat, lon);
        if (data) {
            forecast_success(data);
        } else {
            // If not, get it from the server
            get_forecast_ajax(lat, lon);
        }
    }
    function get_forecast_cache(lat, lon) {
        if ('localStorage' in window && window['localStorage'] !== null) {
            var cache = localStorage["forecast"];
            if (cache) {
                var json = JSON.parse(cache);
                // Has the cache expired already?
                if (json.expires > (new Date()).getTime() && json.lat == lat && json.lon == lon) {
                    return json;
                }
            }
        }
        return false;
    }
    function set_forecast_cache(json, lat, lon) {
        if ('localStorage' in window && window['localStorage'] !== null) {
            json.expires = (new Date()).getTime()+1800000; // 30 minutes from now
            json.lat = lat;
            json.lon = lon;
            localStorage["forecast"] = JSON.stringify(json);
        }
    }
    function get_forecast_ajax(lat, lon) {
        message(wrap('p', 'Looking at the sky&hellip;')+wrap('h1', 'Loading', {'class': 'loading'}));  
        JSONP.get('http://free.worldweatheronline.com/feed/weather.ashx', {
            'key': api_key,
            'date': 'tomorrow',
            'cc': 'no',
            'q': lat+','+lon,
            'format': 'json'
        }, function(data) {
            if (data.data.error) {
                forecast_error()
            } else {
                forecast_success(data, lat, lon);
            }
        });
        timeout = setTimeout(function() {
            forecast_error();
        }, 5000);
    };
    function forecast_success(json, lat, lon) {
        clearTimeout(timeout);
        var weather = json.data.weather[0],
            forecast = weather.weatherDesc[0].value;
        message(wrap('p', 'Tomorrows forecast is') + wrap('h1', forecast));
        set_forecast_cache(json, lat, lon);
    };
    function forecast_error(err) {
        // AJAX request failed
        message(wrap('p', 'Don&rsquo;t panic, but we couldn&rsquo;t find any weather right now.') + wrap('p', wrap('a', 'Try again', {'href': '#', 'class': 'retry'})));
    };
    // Refresh the forecast
    addEvent(document.getElementsByTagName('body')[0], 'click', function(e) {
        if (e.target.className.indexOf('retry') !== -1) {
            get_location();    
            e.preventDefault();
        }
    });
    // Fetch the forecast
    get_location();
} else {
    // Browser doesn't have GeoLocation
    message(wrap('p', 'Drat. We can&rsquo;t find you.') + wrap('p', 'You might need a <a href="http://www.google.com/chrome">modern browser</a>'));
}