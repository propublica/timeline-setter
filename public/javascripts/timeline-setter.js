(function(window, document, undefined){


  var curZoom = 100;
  
  /*
    Mixins
  */
  
  var observable = function(obj){
    obj.bind = function(cb){
      this._callbacks = this._callbacks || [];
      this._callbacks.push(cb);
    };
    
    obj.trigger = function(){
      if(!this._callbacks) return;
      for(var i = 0; callback = this._callbacks[i]; i++)
        callback.apply(this, arguments);
    };
  };

  var transformable = function(obj){
    obj.move = function(e){
      if(!e.type === "move" || !e.deltaX) return;
      
      if(_.isUndefined(this.currOffset)) this.currOffset = 0;
      this.currOffset += e.deltaX;
      this.el.css({"left" : this.currOffset});
    };
    
    obj.zoom = function(e){
      if(!e.type === "zoom") return;
      this.el.css({ "width": e.width });
    };
  };
  
  /*
    Plugins
  */
  
  var touchInit = 'ontouchstart' in document;
  if(touchInit) jQuery.event.props.push("touches");
  
  var draggable = function(obj){
    var drag;
    function mousedown(e){
      e.preventDefault();
      drag = {x: e.pageX};
      e.type = "dragstart";
      obj.el.trigger(e);
    };

    function mousemove(e){
      if(!drag) return;
      e.preventDefault();
      e.type = "dragging";
      e = _.extend(e, {
        deltaX: (e.pageX || e.touches[0].pageX) - drag.x
      });
      drag = { x: (e.pageX || e.touches[0].pageX) };
      obj.el.trigger(e);
    };

    function mouseup(e){
      if(!drag) return;
      drag = null;
      e.type = "dragend";
      obj.el.trigger(e);
    };

    if(!touchInit) {
      obj.el.bind("mousedown", mousedown);
      
      $(document).bind("mousemove", mousemove);
      $(document).bind("mouseup", mouseup);
    } else {
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

  
  
  // safari bug for too fast scrolling, h/t polymaps
  var safari = /WebKit\/533/.test(navigator.userAgent);
  var wheel = function(obj){
    function mousewheel(e){
      e.preventDefault();
      var delta = (e.wheelDelta || -e.detail);
      if(safari){
        var negative = delta < 0 ? -1 : 1;
        delta = Math.log(Math.abs(delta)) * negative * 2;
      };
      e.type = "scrolled";
      e.deltaX = delta;
      obj.el.trigger(e);
    };
    
    obj.el.bind("mousewheel DOMMouseScroll", mousewheel);
  };
  
  /*
    Utils
  */
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
  
  Bounds.prototype.project = function(num, max){
    return (num - this.min) / this.width() * max;
  };
  
  
  /* AUTO INTERVALS */
  
  /* usage:
     var dayRange   = new Intervals(bounds)
     var dayNotches = dayRange.get()
  */

  var Intervals = function(bounds) {
    this.max = bounds.max;
    this.min = bounds.min;
    this.setMaxInterval();
  };
  
  // AP-ify these..
  Intervals.HUMAN_DATES = {
    months : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };

  Intervals.dateStr = function(timestamp, interval) {
    var d                 = new Date(timestamp * 1000);
    var dYear             = d.getFullYear();
    var dMonth            = Intervals.HUMAN_DATES.months[d.getMonth()];
    var dDate             = dMonth + ". " + d.getDate() + ', ' + dYear;
    var dHourWithMinutes  = d.getHours() + ":" + padNumber(d.getMinutes());
    var dHourMinuteSecond = dHourWithMinutes + ":" + padNumber(d.getSeconds());

    switch (interval) {
      case "FullYear":
        return dYear;
      case "Month":
        return dMonth + '., ' + dYear;
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

  Intervals.prototype = _.extend(Intervals.prototype, {
    INTERVALS : {
      FullYear : 31536000,
      Month    : 2592000,
      Date     : 86400,
      Hours    : 3600,
      Minutes  : 60,
      Seconds  : 1
    },
    INTERVAL_ORDER : ['Seconds','Minutes','Hours','Date','Month','FullYear'],

    isAtLeastA : function(interval) {
      return ((this.max - this.min) > this.INTERVALS[interval]);
    },

    setMaxInterval : function() {
      for (var i = 0; i < this.INTERVAL_ORDER.length; i++) 
        if (!this.isAtLeastA(this.INTERVAL_ORDER[i])) break;
      
      // cache our max interval
      this.maxTimestampInterval = this.INTERVAL_ORDER[i - 1];
      this.idx = i - 1;
    },
        
    floor : function(ts){
      var idx = this.idx;
      var date = new Date(ts * 1000);
      while(idx--){
        var intvl = this.INTERVAL_ORDER[idx];
        date["set" + intvl](intvl === "Date" ? 1 : 0);
      }
      return date.getTime() / 1000;
    },
    
    ceil : function(ts){
      var date = new Date(this.floor(ts) * 1000);
      var intvl = this.INTERVAL_ORDER[this.idx];
      // set to the 'next' of whatever interval it is
      date["set" + intvl](date["get" + intvl]() + 1);
      return date.getTime() / 1000;
    },
    
    span : function(ts){
      return this.ceil(ts) - this.floor(ts);
    },
    
    getMaxInterval : function() {
      return this.INTERVALS[this.INTERVAL_ORDER[this.idx]];
    },

    get : function() {
      if (this.intervals) return this.intervals;
      this.intervals = [];
      for (var i = this.floor(this.min); i <= this.ceil(this.max); i += this.span(i)) {
        this.intervals.push({
          human     : Intervals.dateStr(i, this.maxTimestampInterval),
          timestamp : i
        });
      }
      return this.intervals;
    }
  });
  
  
  // Handy dandy function to make sure that events are 
  // triggered at the same time on two objects.'
  
  var sync = function(origin, listener){
    var events = Array.prototype.slice.call(arguments, 2);
    _.each(events, function(ev){
      origin.bind(function(e){
        if(e.type === ev && listener[ev]) 
          listener[ev](e); 
      });
    });
  };
  
  var template = function(query) {
    return _.template($(query).html());
  };
  
  var getYearFromTimestamp = function(timestamp) {
    var d = new Date();
    d.setTime(timestamp * 1000);
    return d.getFullYear();
  };
  
  var cleanNumber = function(str){
    return parseInt(str.replace(/^[^+\-\d]?([+\-]\d+)?.*$/, "$1"), 10);
  };
  
  var padNumber = function(number) {
    return (number < 10 ? '0' : '') + number; 
  };
  
  var hashStrip = /^#*/;
  var history = {
    get : function(){
      return window.location.hash.replace(hashStrip, "");
    },
    
    set : function(url){
      window.location.hash = url;
    }
  };
  
  
  /*
    Models
  */
  // Stores state
  var Timeline = function(data) {
    data = data.sort(function(a, b){ return a.timestamp - b.timestamp; });
    this.bySid  = {};
    this.series = [];
    this.bounds = new Bounds();
    this.bar      = new Bar(this);
    this.cardCont = new CardContainer(this);
    this.createSeries(data);
    
    var range = new Intervals(this.bounds);
    this.intervals = range.get();
    this.bounds.extend(this.bounds.min - range.getMaxInterval() / 2);
    this.bounds.extend(this.bounds.max + range.getMaxInterval() / 2);
    this.bar.render();
    
    sync(this.bar, this.cardCont, "move", "zoom");
    var e = $.Event("render");
    this.trigger(e);
  };
  observable(Timeline.prototype);
  
  Timeline.prototype = _.extend(Timeline.prototype, {
    createSeries : function(series){
      for(var i = 0; i < series.length; i++)
        this.add(series[i]);
    },
    
    add : function(card){
      if(!(card.event_series in this.bySid)){
        this.bySid[card.event_series] = new Series(card, this);
        this.series.push(this.bySid[card.event_series]);
      }
      var series = this.bySid[card.event_series];
      series.add(card);
      this.bounds.extend(series.max());
      this.bounds.extend(series.min());
    }
  });
  
  
  
  /*
   Views
  */
  var Bar = function(timeline) {
    this.el = $(".timeline_notchbar");
    this.el.css({ "left": 0 });
    this.timeline = timeline;
    draggable(this);
    wheel(this);
    _.bindAll(this, "moving", "doZoom");
    this.el.bind("dragging scrolled", this.moving);
    this.el.bind("doZoom", this.doZoom);
    this.template = template("#year_notch_tmpl");
    this.el.bind("dblclick doubletap", function(e){ 
      e.preventDefault(); 
      $(".timeline_zoom_in").click(); 
    });
  };
  observable(Bar.prototype);
  transformable(Bar.prototype);
  
  Bar.prototype = _.extend(Bar.prototype, {
    moving : function(e){
      var parent  = this.el.parent();
      var pOffset = parent.offset().left;
      var offset  = this.el.offset().left;
      var width   = this.el.width();
      // check to make sure we have a delta
      if(_.isUndefined(e.deltaX)) e.deltaX = 0;
      
      // check to make sure the bar isn't out of bounds
      if(offset + width + e.deltaX < pOffset + parent.width())
        e.deltaX = (pOffset + parent.width()) - (offset + width);
      if(offset + e.deltaX > pOffset)
        e.deltaX = pOffset - offset;
      
      // and move both this and the card container.
      e.type = "move";
      this.trigger(e);
      this.move(e);
    },
    
    doZoom : function(e, width){
      var that = this;
      var notch = $(".timeline_notch_active");
      var getCur = function() {
        return notch.length > 0 ? notch.position().left : 0;
      };
      var curr = getCur();
      
      // needs fixin for offset and things, time fer thinkin'
      this.el.animate({"width": width + "%"}, {
        step: function(current, fx) {
          var e = $.Event("dragging");
          var delta = curr - getCur();
          e.deltaX = delta;
          that.moving(e);
          curr = getCur();
          e   = $.Event("zoom");
          e.width = current + "%";
          that.trigger(e);
        } 
      });
    },
    
    render : function(){
      var intervals = this.timeline.intervals;
      var bounds    = this.timeline.bounds;
      
      for (var i = 0; i < intervals.length; i++) {
        var html = this.template({'timestamp' : intervals[i].timestamp, 'human' : intervals[i].human });
        this.el.append($(html).css("left", (bounds.project(intervals[i].timestamp, 100) | 0) + "%"));
      }
    }
  });
  
  
  
  var CardContainer = function(timeline){
    this.el = $("#timeline_card_scroller_inner");
  };
  observable(CardContainer.prototype);
  transformable(CardContainer.prototype);
  
  var colors = ["#065718", "#EDC047", "#91ADD1", "#929E5E", "#9E5E23", "#C44846", "#065718", "#EDD4A5", "#CECECE"];
  var color = function(){
    var chosen;
    if (colors.length > 0) {
      chosen = colors[0];
      colors.shift();
    } else {
      chosen = "#444";
    }
    return chosen;
  };
  
  
  
  var Series = function(series, timeline) {
    this.timeline = timeline;
    this.name     = series.event_series;
    this.color    = this.name.length > 0 ? color() : "#444";
    this.cards    = [];
    _.bindAll(this, "render", "showNotches", "hideNotches");
    this.template = template("#series_legend_tmpl");
    this.timeline.bind(this.render);
  };
  observable(Series.prototype);
  
  Series.prototype = _.extend(Series.prototype, {
    add : function(card){
      var crd = new Card(card, this);
      this.cards.splice(this.sortedIndex(crd), 0, crd);
    },
    
    sortedIndex : function(card){
      return _.sortedIndex(this.cards, card, this._comparator);
    },
    
    _comparator : function(crd){
      return crd.timestamp;
    },
    
    
    hideNotches : function(e){
      e.preventDefault();
      this.el.addClass("series_legend_item_inactive");
      _.each(this.cards, function(card){
        card.hideNotch();
      });
    },
    
    showNotches : function(e){
      e.preventDefault();
      this.el.removeClass("series_legend_item_inactive");
      _.each(this.cards, function(card){
        card.showNotch();
      });
    },
    
    render : function(e){
      if(!e.type === "render") return;
      if(this.name.length === 0) return;
      this.el = $(this.template(this));
      $(".series_nav_container").append(this.el);
      this.el.toggle(this.hideNotches,this.showNotches);
    }
  });
  
  _(["min", "max"]).each(function(key){
    Series.prototype[key] = function() {
      return _[key].call(_, this.cards, this._comparator).get("timestamp");
    };
  });
  
  
  
  var Card = function(card, series) {
    this.series = series;
    var card = _.clone(card);
    this.timestamp = card.timestamp;
    this.attributes = card;
    this.attributes.topcolor = series.color;
    this.template = template("#card_tmpl");
    this.ntemplate = template("#notch_tmpl");
    _.bindAll(this, "render", "activate", "position", "setPermalink");
    this.series.timeline.bind(this.render);
    this.series.bind(this.deactivate);
    this.series.timeline.bar.bind(this.position);
    this.id = [
      this.get('timestamp'), 
      this.get('event_description').split(/ /)[0].replace(/[^a-zA-Z\-]/g,"")
    ].join("-");
  };
  
  Card.prototype = _.extend(Card.prototype, {
    get : function(key){
      return this.attributes[key];
    },
    
    $ : function(query){
      return $(query, this.el);
    },
    
    render : function(e){
      if(!e.type === "render") return;
      this.offset = this.series.timeline.bounds.project(this.timestamp, 100);
      var html = this.ntemplate(this.attributes);
      this.notch = $(html).css({"left": this.offset + "%"});
      $(".timeline_notchbar").append(this.notch);
      this.notch.click(this.activate);
      if (history.get() === this.id) this.activate();
    },
    
    cardOffset : function() {
      if (!this.el) return {
        onBarEdge : false
      };
      
      var that = this;
      var item = this.el.children(".item");
      var currentMargin = this.el.css("margin-left");
      var timeline = $("#timeline");
      var right = (this.el.offset().left + item.width()) - (timeline.offset().left + timeline.width());
      var left = (this.el.offset().left) - timeline.offset().left;
      
      return {
        item : item,
        onBarEdge : (right > 0 && currentMargin === that.originalMargin) ?
                      'right' : 
                    (left < 0 && that.el.css("margin-left") !== that.originalMargin) ?
                      'default' :
                    (left < 0 && that.el.css("margin-left") === that.originalMargin) ?
                      'left' :
                      false
      };
    },
    
    position : function(e) {
      if (e.type !== "move" || !this.el) return;
      var onBarEdge = this.cardOffset().onBarEdge;
      
      switch(onBarEdge) { 
        case 'right':
          this.el.css({"margin-left": -(this.cardOffset().item.width() + 7)}); /// AGGGHHHHHHH, fix this
          this.$(".css_arrow").css("left", this.cardOffset().item.width());
          break;
        case 'default':
          this.el.css({"margin-left": this.originalMargin});
          this.$(".css_arrow").css("left", 0);
      }
    },
    
    moveBarWithCard : function() {
      var e = $.Event('moving');
      var onBarEdge = this.cardOffset().onBarEdge;
      
      switch(onBarEdge) { 
        case 'right':
          e.deltaX = -(this.cardOffset().item.width());
          this.series.timeline.bar.moving(e);
          break;
        case 'left':
          e.deltaX = (this.cardOffset().item.width());
          this.series.timeline.bar.moving(e);
      }
      this.position($.Event('move'));
    },
    
    activate : function(e){
      this.hideActiveCard();
      // draw the actual card
      if (!this.el) {
        this.el = $(this.template(this.attributes));
        this.el.css({"left": this.offset + "%"});
        $("#timeline_card_scroller_inner").append(this.el);
        this.originalMargin = this.el.css("margin-left");
        this.el.delegate(".permalink", "click", this.setPermalink);
        
      }
      
      this.el.show().addClass("card_active");
      
      var max = _.max(_.toArray(this.$(".item_user_html").children()), function(el){ return $(el).width(); });
      if($(max).width() > 150){ /// AGGGHHHHHHH, fix this
        this.$(".item_label").css("width", $(max).width());
      } else {
        this.$(".item_label").css("width", 150);
      }
      
      this.moveBarWithCard();
      this.notch.addClass("timeline_notch_active");
    },
    
    setPermalink : function() {
      history.set(this.id)
    },
    
    hideActiveCard : function() {
      $(".card_active").removeClass("card_active").hide();
      $(".timeline_notch_active").removeClass("timeline_notch_active");
    },
    
    hideNotch : function(){
      this.notch.hide().removeClass("timeline_notch_active").addClass("series_inactive");
      if(this.el) this.el.hide();
    },
    
    showNotch : function(){
      this.notch.removeClass("series_inactive").show();
    }
    
  });
  
  
  
  var ctor = function(){};
  var inherits = function(child, parent){
    ctor.prototype  = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
  };
  
  
  
  // Controls
  var Control = function(direction){
    this.direction = direction;
    this.el = $(this.prefix + direction);
    var that = this;
    this.el.bind('click', function(e) { e.preventDefault(); that.click(e);});
  };
  
  
  
  var Zoom = function(direction) {
    Control.apply(this, arguments);
  };
  inherits(Zoom, Control);
  
  Zoom.prototype = _.extend(Zoom.prototype, {
    prefix : ".timeline_zoom_",
    click : function() {
      curZoom += (this.direction === "in" ? +100 : -100);
      if (curZoom >= 100) {
        $(".timeline_notchbar").trigger('doZoom', [curZoom]);
      } else {
        curZoom = 100;
      }
    }
  });
  
  
  
  var Chooser = function(direction) {
    Control.apply(this, arguments);
    this.notches = $(".timeline_notch");
  };  
  inherits(Chooser, Control);
  
  Chooser.prototype = _.extend(Control.prototype, {
    prefix: ".timeline_choose_",
    click: function(e){
      var el;
      var notches    = this.notches.not(".series_inactive");
      var curCardIdx = notches.index($(".timeline_notch_active"));
      var numOfCards = notches.length;
      if (this.direction === "next") {
        el = (curCardIdx < numOfCards ? notches.eq(curCardIdx + 1) : false);
      } else {
        el = (curCardIdx > 0 ? notches.eq(curCardIdx - 1) : false);
      }
      if(!el) return;
      el.trigger("click");
    }
  });
  
  
  
  $(function(){
    window.timeline = new Timeline(timelineData);
    new Zoom("in");
    new Zoom("out");
    var chooseNext = new Chooser("next");
    var choosePrev = new Chooser("prev");
    if (!$(".card_active").is("*")) chooseNext.click();
    
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
  
})(window, document);
