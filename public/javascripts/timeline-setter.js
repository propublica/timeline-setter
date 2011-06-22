(function(){

  // Expose `TimelineSetter` globally, so we can call `Timeline.Timeline.boot()`
  // to kick off at any point.
  var TimelineSetter = window.TimelineSetter = (window.TimelineSetter || {});

  // Mixins
  // ------
  // Each mixin operates on an object's `prototype`.

  // The `observable` mixin adds simple event notifications to the passed in
  // object. Unlike other notification systems, when an event is triggered every
  // callback bound to the object is invoked.
  var observable = function(obj){

    // Registers a callback function for notification at a later time.
    obj.bind = function(cb){
      this._callbacks = this._callbacks || [];
      this._callbacks.push(cb);
    };

    // Invoke all callbacks registered to the object with `bind`.
    obj.trigger = function(){
      if (!this._callbacks) return;
      for(var i = 0; callback = this._callbacks[i]; i++)
        callback.apply(this, arguments);
    };
  };


  // Each `transformable` contains two event listeners that handle moving associated
  // DOM elements around the page.
  var transformable = function(obj){

    // Move the associated element a specified delta. Of note: because events
    // aren't scoped by key, TimelineSetter uses plain old jQuery events for
    // message passing. So each registered callback first checks to see if the
    // event fired matches the event it is listening for.
    obj.move = function(e){
      if (!e.type === "move" || !e.deltaX) return;

      if (_.isUndefined(this.currOffset)) this.currOffset = 0;
      this.currOffset += e.deltaX;
      this.el.css({"left" : this.currOffset});
    };

    // The width for the `Bar` and `CardContainer` objects is set in percentages,
    // in order to zoom the Timeline all that's needed is to increase or decrease
    // the percentage width.
    obj.zoom = function(e){
      if (!e.type === "zoom") return;
      this.el.css({ "width": e.width });
    };
  };


  // Plugins
  // -------
  // Each plugin operates on an instance of an object.

  // Check to see if we're on a mobile device.
  var touchInit = 'ontouchstart' in document;
  if (touchInit) jQuery.event.props.push("touches");

  // The `draggable` plugin tracks changes in X offsets due to mouse movement
  // or finger gestures and proxies associated events on a particular element.
  // Most of this is inspired by polymaps.
  var draggable = function(obj){
    var drag;

    // Start tracking deltas due to a tap or single click.
    function mousedown(e){
      e.preventDefault();
      drag = {x: e.pageX};
      e.type = "dragstart";
      obj.el.trigger(e);
    };

    // The user is interacting; capture the offset and trigger a `dragging` event.
    function mousemove(e){
      if (!drag) return;
      e.preventDefault();
      e.type = "dragging";
      e = _.extend(e, {
        deltaX: (e.pageX || e.touches[0].pageX) - drag.x
      });
      drag = { x: (e.pageX || e.touches[0].pageX) };
      obj.el.trigger(e);
    };

    // We're done tracking the movement set drag back to `null` for the next event.
    function mouseup(e){
      if (!drag) return;
      drag = null;
      e.type = "dragend";
      obj.el.trigger(e);
    };

    if (!touchInit) {
      // Bind on mouse events if we have a mouse...
      obj.el.bind("mousedown", mousedown);

      $(document).bind("mousemove", mousemove);
      $(document).bind("mouseup", mouseup);
    } else {
      // otherwise capture `touchstart` events in order to simulate `doubletap` events.
      var last;
      obj.el.bind("touchstart", function(e) {
        var now = Date.now();
        var delta = now - (last || now);
        var type = delta > 0 && delta <= 250 ? "doubletap" : "tap";
        drag = {x: e.touches[0].pageX};
        last = now;
        obj.el.trigger($.Event(type));
      });

      obj.el.bind("touchmove", mousemove);
      obj.el.bind("touchend", mouseup);
    };
  };


  // Older versions of safari fire incredibly huge mousewheel deltas. We'll need
  // to dampen the effects.
  var safari = /WebKit\/533/.test(navigator.userAgent);

  // The `wheel` plugin captures events triggered by mousewheel, and dampen the
  // `delta` if running in Safari.
  var wheel = function(obj){
    function mousewheel(e){
      e.preventDefault();
      var delta = (e.wheelDelta || -e.detail);
      if (safari){
        var negative = delta < 0 ? -1 : 1;
        delta = Math.log(Math.abs(delta)) * negative * 2;
      };
      e.type = "scrolled";
      e.deltaX = delta;
      obj.el.trigger(e);
    };

    obj.el.bind("mousewheel DOMMouseScroll", mousewheel);
  };

  // Utilities
  // -----

  // A utility class for storing the extent of the timeline.
  var Bounds = function(){
    this.min = +Infinity;
    this.max = -Infinity;
  };

  Bounds.prototype.extend = function(num){
    this.min = Math.min(num, this.min);
    this.max = Math.max(num, this.max);
  };

  Bounds.prototype.width = function(){
    return this.max - this.min;
  };

  // Translate a particular number from the current bounds to a given range.
  Bounds.prototype.project = function(num, max){
    return (num - this.min) / this.width() * max;
  };


  // `Intervals` is a particularly focused class to calculate even breaks based
  // on the passed in `Bounds`.
  var Intervals = function(bounds, interval) {
    this.max = bounds.max;
    this.min = bounds.min;

    if(!interval || !this.INTERVALS[interval]) {
      var i = this.computeMaxInterval();
      this.maxInterval = this.INTERVAL_ORDER[i];
      this.idx = i;
    } else {
      this.maxInterval = interval;
      this.idx = _.indexOf(this.INTERVAL_ORDER, interval);
    }
  };

  // An object containing human translations for date indexes.
  Intervals.HUMAN_DATES = {
    months : ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.']
  };

  // A utility function to format dates in AP Style.
  Intervals.dateStr = function(timestamp, interval) {
    var d                 = new Date(timestamp);
    var dYear             = d.getFullYear();
    var dMonth            = Intervals.HUMAN_DATES.months[d.getMonth()];
    var dDate             = dMonth + " " + d.getDate() + ', ' + dYear;
    var bigHours          = d.getHours() > 12;
    var isPM              = d.getHours() >= 12;
    var dHourWithMinutes  = (bigHours ? d.getHours() - 12 : (d.getHours() > 0 ? d.getHours() : "12")) + ":" + padNumber(d.getMinutes()) + " " + (isPM ? 'p.m.' : 'a.m.');
    var dHourMinuteSecond = dHourWithMinutes + ":" + padNumber(d.getSeconds());

    switch (interval) {
      case "Decade":
        return dYear;
      case "Lustrum":
        return dYear;
      case "FullYear":
        return dYear;
      case "Month":
        return dMonth + ', ' + dYear;
      case "Week":
        return dDate;
      case "Date":
        return dDate;
      case "Hours":
        return dHourWithMinutes;
      case "Minutes":
        return dHourWithMinutes;
      case "Seconds":
        return dHourMinuteSecond;
    }
  };

  Intervals.prototype = {
    // Sane estimates of date ranges for the `isAtLeastA` test.
    INTERVALS : {
      Decade   : 315360000000,
      Lustrum  : 157680000000,
      FullYear : 31536000000,
      Month    : 2592000000,
      Week     : 604800000,
      Date     : 86400000,
      Hours    : 3600000,
      Minutes  : 60000,
      Seconds  : 1000
    },

    // The order used when testing where exactly a timespan falls.
    INTERVAL_ORDER : ['Seconds','Minutes','Hours','Date','Week','Month','FullYear','Lustrum','Decade'],

    // A test to find the appropriate range of intervals, for example if a range of
    // timestamps only spans hours this will return true when called with `"Hours"`.
    isAtLeastA : function(interval) {
      return ((this.max - this.min) > this.INTERVALS[interval]);
    },

    // Find the maximum interval we should use based on the estimates in `INTERVALS`.
    computeMaxInterval : function() {
      for (var i = 0; i < this.INTERVAL_ORDER.length; i++)
        if (!this.isAtLeastA(this.INTERVAL_ORDER[i])) break;
      return i - 1;
    },

    // Return the calculated `maxInterval`.
    getMaxInterval : function() {
      return this.INTERVALS[this.INTERVAL_ORDER[this.idx]];
    },

    // Return the first year of the decade a Date belongs to as an integer.
    // Decades are defined in the conventional (ie. 60s) sense,
    // instead of the more precise mathematical method that starts
    // with year one. For example, the current decade runs from 2010-2019.
    // And if you pass in the year 2010 or 2015 you'll get 2010 back.
    getDecade : function(date) {
      return (date.getFullYear() / 10 | 0) * 10;
    },

    // Returns the first year of the five year "lustrum" a Date belongs to
    // as an integer. A lustrum is a fancy Roman word for a "five-year period."
    // You can read more about it [here](http://en.wikipedia.org/wiki/Lustrum). 
    // This all means that if you pass in the year 2011 you'll get 2010 back.
    // And if you pass in the year 1997 you'll get 1995 back.
    getLustrum : function(date) {
      return (date.getFullYear() / 5 | 0) * 5;
    },

    // Return a Date object rounded down to the previous Sunday, a.k.a. the first day of the week.
    getWeekFloor: function(date) {
      thisDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      thisDate.setDate(date.getDate() - date.getDay());
      return thisDate;
    },

    // Return a Date object rounded up to the next Sunday, a.k.a. the start of the next week.
    getWeekCeil: function(date) {
      thisDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      thisDate.setDate(thisDate.getDate() + (7 - date.getDay()));
      return thisDate;
    },

    // Zero out a date from the current interval down to seconds.
    floor : function(ts){
      var date  = new Date(ts);
      var intvl = this.INTERVAL_ORDER[this.idx];
      var idx   = this.idx > _.indexOf(this.INTERVAL_ORDER,'FullYear') ?
                  _.indexOf(this.INTERVAL_ORDER,'FullYear') :
                  idx;

      // Zero the special extensions, and adjust as idx necessary.
      switch(intvl){
        case 'Decade':      
          date.setFullYear(this.getDecade(date));
          break;
        case 'Lustrum':
          date.setFullYear(this.getLustrum(date));
          break;
        case 'Week':
          date.setDate(this.getWeekFloor(date).getDate());
          idx = _.indexOf(this.INTERVAL_ORDER, 'Week');
      }

      // Zero out the rest
      while(idx--){
        var intvl = this.INTERVAL_ORDER[idx];
        if(intvl !== 'Week') date["set" + intvl](intvl === "Date" ? 1 : 0);
      }

      return date.getTime();
    },

    // Find the next date based on the past in timestamp.
    ceil : function(ts){
      var date = new Date(this.floor(ts));
      var intvl = this.INTERVAL_ORDER[this.idx];
      switch(intvl){
        case 'Decade':
          date.setFullYear(this.getDecade(date) + 10);
          break;
        case 'Lustrum':
          date.setFullYear(this.getLustrum(date) + 5);
          break;
        case 'Week':
          date.setTime(this.getWeekCeil(date).getTime());
          break;
        default: 
          date["set" + intvl](date["get" + intvl]() + 1);
      }
      return date.getTime();
    },

    // The actual difference in timespans accounting for time oddities like
    // different length months and leap years.
    span : function(ts){
      return this.ceil(ts) - this.floor(ts);
    },

    // Calculate and return a list of human formatted strings and raw timestamps.
    getRanges : function() {
      if (this.intervals) return this.intervals;
      this.intervals = [];
      for (var i = this.floor(this.min); i <= this.ceil(this.max); i += this.span(i)) {
        this.intervals.push({
          human     : Intervals.dateStr(i, this.maxInterval),
          timestamp : i
        });
      }
      return this.intervals;
    }
  };

  // Handy dandy function to bind a listener on multiple events. For example,
  // `Bar` and `CardContainer` are bound like so on "move" and "zoom":
  //
  //      sync(this.bar, this.cardCont, "move", "zoom");
  //
  var sync = function(origin, listener){
    var events = Array.prototype.slice.call(arguments, 2);
    _.each(events, function(ev){
      origin.bind(function(e){
        if (e.type === ev && listener[ev])
          listener[ev](e);
      });
    });
  };

  // Get a template from the DOM and return a compiled function.
  var template = function(query) {
    return _.template($(query).html());
  };

  // Simple function to strip suffixes like `"px"` and return a clean integer for
  // use.
  var cleanNumber = function(str){
    return parseInt(str.replace(/^[^+\-\d]?([+\-]?\d+)?.*$/, "$1"), 10);
  };

  // Zero pad a number less than 10 and return a 2 digit value.
  var padNumber = function(number) {
    return (number < 10 ? '0' : '') + number;
  };

  // A quick and dirty hash manager for setting and getting values from
  // `window.location.hash`
  var hashStrip = /^#*/;
  var history = {
    get : function(){
      return window.location.hash.replace(hashStrip, "");
    },

    set : function(url){
      window.location.hash = url;
    }
  };

  // Every new `Series` gets new color. If there are too many series
  // the remaining series will be a simple gray.

  // These colors can be styled like such in
  // timeline-setter.css, where the numbers 1-9 cycle through in that order:
  //
  //      .TS-notch_color_1,.TS-series_legend_swatch_1 {
  //        background: #065718 !important;
  //      }
  //      .TS-css_arrow_color_1 {
  //        border-bottom-color:#065718 !important;
  //      }
  //      .TS-item_color_1 {
  //       border-top:1px solid #065718 !important;
  //      }
  //
  // The default color will fall through to what is styled with
  // `.TS-foo_color_default`
  var curColor = 1;
  var color = function(){
    var chosen;
    if (curColor < 10) {
      chosen = curColor;
      curColor += 1;
    } else {
      chosen = "default";
    }
    return chosen;
  };



  // Models
  // ------

  // The main kickoff point for rendering the timeline. The `Timeline` constructor
  // takes a json array of card representations and then builds series, calculates
  // intervals `sync`s the `Bar` and `CardContainer` objects and triggers the
  // `render` event.
  var Timeline = TimelineSetter.Timeline = function(data, config) {
    data = data.sort(function(a, b){ return a.timestamp - b.timestamp; });
    this.bySid    = {};
    this.series   = [];
    this.config   = (config || {});
    this.bounds   = new Bounds();
    this.bar      = new Bar(this);
    this.cardCont = new CardScroller(this);
    this.createSeries(data);
    var range = new Intervals(this.bounds, config.interval);
    this.intervals = range.getRanges();
    this.bounds.extend(this.bounds.min - range.getMaxInterval() / 2);
    this.bounds.extend(this.bounds.max + range.getMaxInterval() / 2);
    this.bar.render();

    sync(this.bar, this.cardCont, "move", "zoom");
    var e = $.Event("render");
    this.trigger(e);
  };
  observable(Timeline.prototype);

  Timeline.prototype = _.extend(Timeline.prototype, {
    // Loop through the JSON and add each element to a series.
    createSeries : function(series){
      for(var i = 0; i < series.length; i++)
        this.add(series[i]);
    },

    // If a particular element in the JSON array mentions a series that's not
    // in the `bySid` object add it. Then add a card to the `Series` and extend
    // the global `bounds`.
    add : function(card){
      if (!(card.series in this.bySid)){
        this.bySid[card.series] = new Series(card, this);
        this.series.push(this.bySid[card.series]);
      }
      var series = this.bySid[card.series];
      series.add(card);

      this.bounds.extend(series.max());
      this.bounds.extend(series.min());
    }
  });




  // Views
  // -----

  // The main interactive element in the timeline is `.TS-notchbar`. Behind the
  // scenes `Bar` handles the moving and zooming behaviours through the `draggable`
  // and `wheel` plugins.
  var Bar = function(timeline) {
    this.el = $(".TS-notchbar");
    this.el.css({ "left": 0 });
    this.timeline = timeline;
    draggable(this);
    wheel(this);
    _.bindAll(this, "moving", "doZoom");
    this.el.bind("dragging scrolled", this.moving);
    this.el.bind("doZoom", this.doZoom);
    this.template = template("#TS-year_notch_tmpl");
    this.el.bind("dblclick doubletap", function(e){
      e.preventDefault();
      $(".TS-zoom_in").click();
    });
  };
  observable(Bar.prototype);
  transformable(Bar.prototype);

  Bar.prototype = _.extend(Bar.prototype, {
    // Every time the `Bar` is moved, it calculates whether the proposed movement
    // will move the `.TS-notchbar` off of its parent. If so, it recaculates
    // `deltaX` to be a more correct value.
    moving : function(e){
      var parent  = this.el.parent();
      var pOffset = parent.offset().left;
      var offset  = this.el.offset().left;
      var width   = this.el.width();
      if (_.isUndefined(e.deltaX)) e.deltaX = 0;

      if (offset + width + e.deltaX < pOffset + parent.width())
        e.deltaX = (pOffset + parent.width()) - (offset + width);
      if (offset + e.deltaX > pOffset)
        e.deltaX = pOffset - offset;

      e.type = "move";
      this.trigger(e);
      this.move(e);
    },

    // As the timeline zooms, the `Bar` tries to keep the current notch (i.e.
    // `.TS-notch_active`) as close to its original position as possible.
    // There's a slight bug here because the timeline zooms and then moves the
    // bar to correct for this behaviour, and in future versions we'll fix this.
    doZoom : function(e, width){
      var that = this;
      var notch = $(".TS-notch_active");
      var getCur = function() {
        return notch.length > 0 ? notch.position().left : 0;
      };
      var curr = getCur();

      this.el.animate({"width": width + "%"}, {
        step: function(current, fx) {
          var e = $.Event("dragging");
          var delta = curr - getCur();
          e.deltaX = delta;
          that.moving(e);
          curr = getCur();
          e = $.Event("zoom");
          e.width = current + "%";
          that.trigger(e);
        }
      });
    },

    // When asked to render the bar places the appropriate timestamp notches
    // inside `.TS-notchbar`.
    render : function(){
      var intervals = this.timeline.intervals;
      var bounds    = this.timeline.bounds;

      for (var i = 0; i < intervals.length; i++) {
        var html = this.template({'timestamp' : intervals[i].timestamp, 'human' : intervals[i].human });
        this.el.append($(html).css("left", bounds.project(intervals[i].timestamp, 100) + "%"));
      }
    }
  });


  // The `CardScroller` mirrors the moving and zooming of the `Bar` and is the
  // canvas where individual cards are rendered.
  var CardScroller = function(timeline){
    this.el = $("#TS-card_scroller_inner");
  };
  observable(CardScroller.prototype);
  transformable(CardScroller.prototype);


  // Each `Series` picks a unique color and keeps an array of `Cards`.
  var Series = function(series, timeline) {
    this.timeline = timeline;
    this.name     = series.series;
    this.color    = this.name.length > 0 ? color() : "default";
    this.cards    = [];
    _.bindAll(this, "render", "showNotches", "hideNotches");
    this.template = template("#TS-series_legend_tmpl");
    this.timeline.bind(this.render);
  };
  observable(Series.prototype);

  Series.prototype = _.extend(Series.prototype, {
    // Create and add a particular card to the cards array.
    add : function(card){
      var crd = new Card(card, this);
      this.cards.push(crd);
    },

    // The comparing function for `max` and `min`.
    _comparator : function(crd){
      return crd.timestamp;
    },

    // Inactivate this series legend item and trigger a `hideNotch` event.
    hideNotches : function(e){
      e.preventDefault();
      this.el.addClass("TS-series_legend_item_inactive");
      this.trigger($.Event("hideNotch"));
    },

    // Activate the legend item and trigger the `showNotch` event.
    showNotches : function(e){
      e.preventDefault();
      this.el.removeClass("TS-series_legend_item_inactive");
      this.trigger($.Event("showNotch"));
    },

    // Create and append the label to `.TS-series_nav_container` and bind up
    // `hideNotches` and `showNotches`.
    render : function(e){
      if (!e.type === "render") return;
      if (this.name.length === 0) return;
      this.el = $(this.template(this));
      $(".TS-series_nav_container").append(this.el);
      this.el.toggle(this.hideNotches, this.showNotches);
    }
  });

  // Proxy to underscore for `min` and `max`.
  _(["min", "max"]).each(function(key){
    Series.prototype[key] = function() {
      return _[key].call(_, this.cards, this._comparator).get("timestamp");
    };
  });


  // Every `Card` handles a notch div which is immediately appended to the `Bar`
  // and a `.TS-card_container` which is lazily rendered.
  var Card = function(card, series) {
    this.series = series;
    var card = _.clone(card);
    this.timestamp = card.timestamp;
    this.attributes = card;
    this.attributes.topcolor = series.color;

    this.template = template("#TS-card_tmpl");
    this.ntemplate = template("#TS-notch_tmpl");
    _.bindAll(this, "render", "activate", "flip", "setPermalink", "toggleNotch");
    this.series.bind(this.toggleNotch);
    this.series.timeline.bind(this.render);
    this.series.timeline.bar.bind(this.flip);
    this.id = [
      this.get('timestamp'),
      this.get('description').split(/ /)[0].replace(/[^a-zA-Z\-]/g,"")
    ].join("-");
  };

  Card.prototype = {
    // Get a particular attribute by key.
    get : function(key){
      return this.attributes[key];
    },

    // A version of `jQuery` scoped to the `Card`'s element.
    $ : function(query){
      return $(query, this.el);
    },

    // When each `Card` is rendered via a render event, it appends a notch to the
    // `Bar` and binds a click handler so it can be activated. if the `Card`'s id
    // is currently selected via `window.location.hash` it's activated.
    render : function(e){
      if (!e.type === "render") return;
      this.offset = this.series.timeline.bounds.project(this.timestamp, 100);
      var html = this.ntemplate(this.attributes);
      this.notch = $(html).css({"left": this.offset + "%"});
      $(".TS-notchbar").append(this.notch);
      this.notch.click(this.activate);
      if (history.get() === this.id) this.activate();
    },

    // As the `Bar` moves the current card checks to see if it's outside the viewport,
    // if it is the card is flipped so as to be visible for the longest period
    // of time. The magic number here (7) is half the width of the css arrow.
    flip : function(e) {
      if (e.type !== "move" || !this.el || !this.el.is(":visible")) return;
      var rightEdge   = this.$(".TS-item").offset().left + this.$(".TS-item").width();
      var tRightEdge  = $("#timeline_setter").offset().left + $("#timeline_setter").width();
      var margin      = this.el.css("margin-left") === this.originalMargin;
      var flippable   = this.$(".TS-item").width() < $("#timeline_setter").width() / 2;
      var offTimeline = this.el.position().left - this.$(".TS-item").width() < 0;

      // If the card's right edge is more than the timeline's right edge and 
      // it's never been flipped before and it won't go off the timeline when
      // flipped. We'll flip it.
      if (tRightEdge - rightEdge < 0 && margin && !offTimeline) {
        this.el.css({"margin-left": -(this.$(".TS-item").width() + 7)});
        this.$(".TS-css_arrow").css({"left" : this.$(".TS-item").width()});
        // Otherwise, if the card is off the left side of the timeline and we have
        // flipped it before and the card's width is less than half of the width
        // of the whole timeline, we'll flip it to the default position.
      } else if (this.el.offset().left - $("#timeline_setter").offset().left < 0 && !margin && flippable) {
        this.el.css({"margin-left": this.originalMargin});
        this.$(".TS-css_arrow").css({"left": 0});
      }
    },

    // The first time a card is activated it renders its `template` and appends
    // its element to the `Bar`. After doing so it sets the width if `.TS-item_label`
    // and moves the `Bar` if its element outside the visible portion of the
    // timeline.
    activate : function(e){
      this.hideActiveCard();
      if (!this.el) {
        this.el = $(this.template({card: this}));
        this.el.css({"left": this.offset + "%"});
        $("#TS-card_scroller_inner").append(this.el);
        this.originalMargin = this.el.css("margin-left");
        this.el.delegate(".TS-permalink", "click", this.setPermalink);
        // Reactivate if there are images in the html so we can recalculate
        // widths and position accordingly.
        this.$("img").load(this.activate);
      }
      this.el.show().addClass(("TS-card_active"));
      this.notch.addClass("TS-notch_active");
      this.setWidth();

      // In the case that the card is outside the bounds the wrong way when 
      // it's flipped, we'll take care of it here before we move the actual
      // card.
      this.flip($.Event("move"));
      this.move();
    },

    // For Internet Explorer each card sets the width of` .TS-item_label` to
    // the maximum width of the card's children, or if that is less than the
    // `.TS-item_year` element's width, `.TS-item_label` gets `.TS-item_year`s
    // width. Which is a funny way of saying, if you'd like to set the width of
    // the card as a whole, fiddle with `.TS-item_year`s width.
    setWidth : function(){
      var max = _.max(_.toArray(this.$(".TS-item_user_html").children()), function(el){ return $(el).width(); });
      if ($(max).width() > this.$(".TS-item_year").width()) {
        this.$(".TS-item_label").css("width", $(max).width());
      } else {
        this.$(".TS-item_label").css("width", this.$(".TS-item_year").width());
      }
    },

    // Move the `Bar` if the card is outside the visible region on activation.
    move : function() {
      var e = $.Event('moving');
      var offset  = this.$(".TS-item").offset();
      var toffset = $("#timeline_setter").offset();
      if (offset.left < toffset.left) {
        e.deltaX = toffset.left - offset.left + cleanNumber(this.$(".TS-item").css("padding-left"));
        this.series.timeline.bar.moving(e);
      } else if (offset.left + this.$(".TS-item").outerWidth() > toffset.left + $("#timeline_setter").width()) {
        e.deltaX = toffset.left + $("#timeline_setter").width() - (offset.left + this.$(".TS-item").outerWidth());
        this.series.timeline.bar.moving(e);
      }
    },

    // The click handler to set the current hash to the `Card`'s id.
    setPermalink : function() {
      history.set(this.id);
    },

    // Globally hide any cards with `TS-card_active`.
    hideActiveCard : function() {
      $(".TS-card_active").removeClass("TS-card_active").hide();
      $(".TS-notch_active").removeClass("TS-notch_active");
    },

    // An event listener to toggle this notche on and off via `Series`.
    toggleNotch : function(e){
      switch (e.type) {
        case "hideNotch":
          this.notch.hide().removeClass("TS-notch_active").addClass("TS-series_inactive");
          if (this.el) this.el.hide();
          return;
        case "showNotch":
          this.notch.removeClass("TS-series_inactive").show();
      }
    }

  };


  // Simple inheritance helper for `Controls`.
  var ctor = function(){};
  var inherits = function(child, parent){
    ctor.prototype  = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
  };

  // Controls
  // --------

  // Each control is basically a callback wrapper for a given DOM element.
  var Control = function(direction){
    this.direction = direction;
    this.el = $(this.prefix + direction);
    var that = this;
    this.el.bind('click', function(e) { e.preventDefault(); that.click(e);});
  };

  // Each `Zoom` control adjusts the `curZoom` when clicked.
  var curZoom = 100;
  var Zoom = function(direction) {
    Control.apply(this, arguments);
  };
  inherits(Zoom, Control);

  Zoom.prototype = _.extend(Zoom.prototype, {
    prefix : ".TS-zoom_",

    // Adjust the `curZoom` up or down by 100 and trigger a `doZoom` event on
    // `.TS-notchbar`
    click : function() {
      curZoom += (this.direction === "in" ? +100 : -100);
      if (curZoom >= 100) {
        $(".TS-notchbar").trigger('doZoom', [curZoom]);
      } else {
        curZoom = 100;
      }
    }
  });


  // Each `Chooser` activates the next or previous notch.
  var Chooser = function(direction) {
    Control.apply(this, arguments);
    this.notches = $(".TS-notch");
  };
  inherits(Chooser, Control);

  Chooser.prototype = _.extend(Control.prototype, {
    prefix: ".TS-choose_",

    // Figure out which notch to activate and do so by triggering a click on
    // that notch.
    click: function(e){
      var el;
      var notches    = this.notches.not(".TS-series_inactive");
      var curCardIdx = notches.index($(".TS-notch_active"));
      var numOfCards = notches.length;
      if (this.direction === "next") {
        el = (curCardIdx < numOfCards ? notches.eq(curCardIdx + 1) : false);
      } else {
        el = (curCardIdx > 0 ? notches.eq(curCardIdx - 1) : false);
      }
      if (!el) return;
      el.trigger("click");
    }
  });


  // Finally, let's create the whole timeline. Boot is exposed globally via
  // `TimelineSetter.Timeline.boot()` which takes the JSON generated by
  // the timeline-setter binary as an argument. This is handy if you want
  // to be able to generate timelines at arbitrary times (say, for example,
  // in an ajax callback).
  //
  // In the default install of TimelineSetter, Boot is called in the generated
  // HTML. We'll kick everything off by creating a `Timeline`, some `Controls`
  // and binding to `"keydown"`.
  Timeline.boot = function(data, config) {
    $(function(){

      TimelineSetter.timeline = new Timeline(data, config || {});
      new Zoom("in");
      new Zoom("out");
      var chooseNext = new Chooser("next");
      var choosePrev = new Chooser("prev");
      if (!$(".TS-card_active").is("*")) chooseNext.click();

      $(document).bind('keydown', function(e) {
        if (e.keyCode === 39) {
          chooseNext.click();
        } else if (e.keyCode === 37) {
          choosePrev.click();
        } else {
          return;
        }
      });
    });

  };

})();
