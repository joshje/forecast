var api_key = '9xtjv74bqu88hr83ektt75g8',
    timeout,
    weather_types = {
        'Sunny': [113],
        'PartlyCloudy': [116],
        'Cloudy': [119, 122],
        'Foggy': [143, 248, 260],
        'ScatteredShowers': [176, 185, 263, 293, 299],
        'Rainy': [266, 281, 284, 296, 302, 305, 308, 311, 314, 317, 320, 353, 356, 359, 362, 365],
        'Snowy': [179, 182, 227, 230, 323, 326, 329, 332, 335, 338, 368, 371],
        'Hail': [350, 374, 377],
        'Thundery': [200, 386, 389, 392, 395]
    };
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
    var wrapped = '<'+tag;
    if (opts) {
        for (opt in opts) {
            wrapped += ' '+opt+'="'+opts[opt]+'"';
        }
    }
    wrapped += '>'+text+'</'+tag+'>';
    return wrapped;
};
var message = function(msg) {
    var forecast = document.getElementById('forecast');
    forecast.innerHTML = msg;
};
(function() {
    var count = 0,
        span = document.createElement('span');
    span.className = 'support';
    span.innerHTML = 'Loading';
    document.getElementsByTagName('body')[0].appendChild(span);
    var test = setInterval(function() {
        var width = span.offsetWidth;
        if (width < 100) {
            clearInterval(test);
            document.getElementsByTagName('html')[0].className = 'js'
        } else if (++count >= 10) {
            clearInterval(test);
            document.getElementsByTagName('html')[0].className = 'js no-liga';        
        }
    }, 50);
    
})();
(function() {
    if (window.applicationCache) {
        window.applicationCache.addEventListener('updateready', function(e) {
            window.applicationCache.swapCache();
            window.location.reload();
          }, false);
    }
})();
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
        JSONP.get('http://api.worldweatheronline.com/free/v1/weather.ashx', {
            'key': api_key,
            'date': date_tomorrow(),
            'cc': 'no',
            'q': lat+','+lon,
            'format': 'json'
        }, function(json) {
            if (json.data.error) {
                forecast_error()
            } else {
                set_forecast_cache(json, lat, lon);
                forecast_success(json, lat, lon);
            }
        });
        timeout = setTimeout(function() {
            forecast_error();
        }, 5000);
    };
    function forecast_success(json, lat, lon) {
        clearTimeout(timeout);
        var forecast = forecast_lookup(json.data.weather[0].weatherCode);
        if (!forecast) {
            forecast = json.data.weather[0].weatherDesc[0].value
        }
        message(wrap('p', 'Tomorrow&rsquo;s forecast is') + wrap('h1', forecast));
    };
    function forecast_error(err) {
        // AJAX request failed
        message(wrap('p', 'Don&rsquo;t panic, but we couldn&rsquo;t find any weather right now.') + wrap('p', wrap('a', 'Try again', {'href': '#', 'class': 'retry'})));
    };
    function forecast_lookup(code) {
        for (type in weather_types) {
            for (c in weather_types[type]) {
                if (code == weather_types[type][c]) {
                    return type;
                }
            }
        }
    }
    function date_tomorrow() {
        var tomorrow = new Date((new Date()).getTime() + 24 * 60 * 60 * 1000),
            y = tomorrow.getFullYear().toString(),
            m = (tomorrow.getMonth()+1).toString(),
            d  = tomorrow.getDate().toString();
        return y + '-' + (m[1]?m:"0"+m[0]) + '-' + (d[1]?d:"0"+d[0]);
    }
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

(function() {
    var footer = document.getElementsByTagName('footer')[0],
        footerReveal = document.createElement('a');
    footer.className += ' toggle';
    footerReveal.innerHTML = 'information';
    footerReveal.className = 'footer-reveal';
    footerReveal.href = '#';
    addEvent(footerReveal, 'click', function(e) {
        footer.style.height = 'auto';
        footer.style.opacity = 1;
        footerReveal.style.opacity = 0;
        e.preventDefault();
    });
    footer.parentNode.insertBefore(footerReveal, footer);
})();

// Google Analytics
var _gaq = _gaq || [];
    _gaq.push(['_setAccount', 'UA-3873385-12']);
    _gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.defer = true;
    ga.src = 'http://www.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
