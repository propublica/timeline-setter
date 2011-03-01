function TimelineSetter(timelineData) {
  this.items = timelineData;
  this.times = _(this.items).map(function(q){
    return q.timestamp;
  }).sort(function(a,b) {
    return a - b;
  });
  this.max      = _(this.times).max();
  this.min      = _(this.times).min();
  this.notchbar = $(".timeline_notchbar");
  _.bindAll(this, 'showCard', 'zoom', 'scrub', 'pixelScrub', 'go', 'next', 'prev')
};

TimelineSetter.TOP_COLORS = ['#7C93AF', '#74942C', '#C44846', "#444"];

TimelineSetter.prototype.itemFromTimestamp = function(timestamp) {
  item = _(this.items).select(function(q) {
    return q.timestamp === Number(timestamp);
  })[0];
  return item;
}

TimelineSetter.prototype.createSeries = function() {
  var series    = _(_(this.items).map(function(q) { return q.event_series })).uniq();
  series_colors = {};
  for(i = 0; i < series.length; i++) { 
    series_colors[series[i]] = TimelineSetter.TOP_COLORS[i];
  }
  _(this.items).each(function(q) {
    q.topcolor = series_colors[q['event_series']]
  })
  window.series        = this.series        = series
  window.series_colors = this.series_colors = series_colors;
  $(".series_nav_container").append(TimelineSetter.domTemplate("#series_legend_tmpl", window.series))
  $(".series_nav_container .series_legend_item").click(function() {
    var series = $(this).attr("data-series");
    $(this).toggleClass("series_legend_item_inactive")
    $("div[data-notch-series= " + series + "]").toggle();
  })
}

TimelineSetter.prototype.createNotches = function() {
  var that = this;
  this.createSeries();
  _(this.items).each(function(item) {
    var timestamp,position,tmpl,html;
    timestamp = item.timestamp;
    position  = that.calculatePosition(timestamp);
    html      = TimelineSetter.domTemplate("#notch_tmpl",item);

    $(".timeline_notchbar").append(html);
    $(".notch_" + timestamp).css("right",position + "%");
  });
};

TimelineSetter.prototype.createYearNotches = function() {
  // find earliest year and latest year in the set,
  // and add notches for every year in between
  var years,earliestYear,latestYear,i;
  var getYearFromTimestamp = function(timestamp) {
    var d = new Date();
    d.setTime(timestamp * 1000);
    return d.getFullYear()
  }

  earliestYear = getYearFromTimestamp(this.min);
  latestYear   = getYearFromTimestamp(this.max)

  for (i = earliestYear; i < latestYear + 1; i++) {
    var timestamp,year,html;
    timestamp = Date.parse(i) / 1000;
    year      = i;
    html      = TimelineSetter.domTemplate("#year_notch_tmpl", {'timestamp' : timestamp, 'year' : year })
    $(".timeline_notchbar").append(html);
    $(".year_notch_" + timestamp).css("right",this.calculatePosition(timestamp) + "%");
  }
}


TimelineSetter.prototype.calculatePosition = function(timestamp) {
  return ((this.max - timestamp) / (this.max - this.min)) * 100;
};

TimelineSetter.prototype.template = function(timestamp) {
  var item,tmpl,html;
  html = TimelineSetter.domTemplate("#card_tmpl",this.itemFromTimestamp(timestamp))
  return html;
};

TimelineSetter.prototype.showCard = function(timestamp, html) {
  if (!timestamp) return;
  $("#timeline_card_container").html(html) // do this first, so we can get the computed width
                                           // important so we can calculate the offset
  
  
  var eventNotchOffset        = $(".notch_" + timestamp).offset();
  var timelineContainerWidth  = $("#timeline").width();
  var timelineOffset          = $("#timeline").offset();
  var cardWidth               = $(".item_active").width();
  var cardOffsetLeft = ((timelineContainerWidth - eventNotchOffset.left) < cardWidth) ? eventNotchOffset.left - (cardWidth - 20) : eventNotchOffset.left

  // if outside the bounds of #timeline, hide the card and return ...
  if ((cardOffsetLeft < timelineOffset.left) || ((cardOffsetLeft + cardWidth) > (timelineContainerWidth + timelineOffset.left))) {
    $("#timeline_card_container, .css_arrow").hide()
    return;
  }
  // ... otherwise show the card ...
  $("#timeline_card_container")
    .show()
    .offset({left : cardOffsetLeft - 15, top : eventNotchOffset.top + 41})  
  
  // ... and the css arrow
  $(".css_arrow")
    .show()
    .css("border-bottom-color",this.itemFromTimestamp(timestamp).topcolor)
    .offset({left : eventNotchOffset.left, top : eventNotchOffset.top + 22})
  $(".timeline_notch").removeClass("timeline_notch_active")
  $(".notch_" + timestamp).addClass("timeline_notch_active")
  
  // cache where we are for prev and next
  this.curCardTimestamp = timestamp;
  this.curCardHtml = html;
}

TimelineSetter.prototype.showFirstCard = function(cb) {
  var timestamp = this.times[0];
  var html      = this.template(timestamp);
  this.showCard(timestamp, html);
  if (cb) { cb(timestamp) };
}

TimelineSetter.prototype.go = function(showCardFunc, direction) {
  var curCardTimestamp  = typeof(this.curCardTimestamp) === "undefined" ? this.times[0] : this.curCardTimestamp;
  var curCardIdx        = _.indexOf(this.times,curCardTimestamp);
  var numOfCards        = this.times.length - 1;
  var that              = this;
  var timestamp;
  
  
  if (direction === "next") {
    timestamp = (curCardIdx < numOfCards ? this.times[curCardIdx + 1] : false);
  } else {
    timestamp = (curCardIdx > 0 ? this.times[curCardIdx - 1] : false);
  }
  if (timestamp === false) return;
  showCardFunc.apply(that, [timestamp, that.template(timestamp)])
}

TimelineSetter.prototype.next = function() {
  return this.go(this.showCard, 'next');
}

TimelineSetter.prototype.prev = function() {
  return this.go(this.showCard, 'prev');
}



TimelineSetter.prototype.zoom = function(direction, cb) {
  var el            = $(".timeline_notchbar, #timeline_card_scroller_inner")
  var barWidth      = el.width();
  var barOffsetLeft = el.offset().left;
  this.initialZoom  = this.initialZoom ? this.initialZoom : barWidth;
  this.curZoom      = this.curZoom     ? this.curZoom     : barWidth;
  this.curOffset    = this.curOffset   ? this.curOffset   : barOffsetLeft;
  
  if (direction === "in") {
    this.curOffset -= this.curZoom / 2
    this.curZoom *= 2;
    el.animate({ 
      width : this.curZoom, 
      left  : this.curOffset
    }, function() {
      if (cb) { cb(); }
    });
  } else if (this.curZoom && (this.curZoom < (this.initialZoom * 2))) {
    this.draggify();
    return;
  } else {
    this.curZoom /= 2;
    this.curOffset += this.curZoom/2
    el.animate({ 
      width : this.curZoom, 
      left  : this.curOffset
    }, function() {
      if (cb) { cb(); }
    });
  }
  this.draggify();
}

TimelineSetter.prototype.scrub = function(direction, cb) {
  //don't allow scrubbage if we're not zoomed in
  if (!this.curZoom || this.curZoom === this.initialZoom) return;
  
  //scrubbing "right" will move the notchbar "left" and vice versa
  //      << [=====] >>
  if (direction === "left") {
    this.curOffset += (this.curZoom * .20);
  }
  
  if (direction === "right") {
    this.curOffset -= (this.curZoom * .20);
  }

  $(".timeline_notchbar, #timeline_card_scroller_inner").animate({ 
    left : this.curOffset 
  }, function() {
    if (cb) { cb(); }
  });  
}

TimelineSetter.prototype.pixelScrub = function(delta) {
  this.notchbar.css("left", this.notchbar.position().left + delta)
}

// NB: de-draggifying also 'disables' the buttons you can't do when not zoomed in. 
TimelineSetter.prototype.draggify = function() {
  if (this.curZoom >= this.initialZoom * 2) {
    this.notchbar
      .addClass("timeline_notchbar_draggable")
      .draggable({axis : 'x', disabled : false})
    $(".timeline_controls a")
      .removeClass("timeline_controls_disabled");
    ;    
  } else {
    this.notchbar
      .removeClass("timeline_notchbar_draggable")
      .draggable({disabled : true});
    $(".timeline_controls a.timeline_scrub, .timeline_controls a.timeline_zoom_out")
      .addClass("timeline_controls_disabled");
    ;
  }
}

TimelineSetter.prototype.autoResize = function(width) {
  var optimalWidth = 960;
  var zoomIntervals = Math.floor(Math.floor(width / optimalWidth * 100) / 20)
  if (zoomIntervals === this.curZoomIntervals) return;
  var i;
  
  if (!this.curZoomIntervals || zoomIntervals < this.curZoomIntervals) {
    for (i = 5; i > zoomIntervals; i--) {
      this.zoom('in');
    }
  } else {
    for (i = this.curZoomIntervals; i < 5; i++) {
      this.zoom('out')
    }
  }
  // cache width
  this.curZoomIntervals = zoomIntervals;
}

/* ---- */

TimelineSetter.domTemplate = function(el,data) {
  tmpl = _.template($(el).html());
  return html = tmpl(data);
}

/* ---- */

TimelineSetter.bootStrap = function(timelineData) {
  var timeline = new TimelineSetter(timelineData);
  timeline.createNotches();
  timeline.createYearNotches();
  timeline.autoResize($("#timeline").width());
  timeline.draggify();
  return timeline;
}

$(document).ready(function() {
  var page_timeline = TimelineSetter.bootStrap(timelineData);
  _.extend(page_timeline, Backbone.Events)
  
    page_timeline.showFirstCard(function(timestamp) {
      $(".notch_" + timestamp).addClass("timeline_notch_active");
    });
  
  /* events */
  
  
  // notch click
  $(".timeline_notch").click(function() {
    var timestamp = $(this).attr("data-timestamp")
    var html      = page_timeline.template(timestamp);
    page_timeline.showCard(timestamp, html);
  });


  page_timeline.notchbar.bind("drag", function() {
    page_timeline.showCard(page_timeline.curCardTimestamp,page_timeline.curCardHtml);
  });
  
  _(["pixelScrub", "mousewheel", "DOMMouseScroll", "dblclick"]).each(function(q) {
    page_timeline.bind(q, function() {
      page_timeline.showCard(page_timeline.curCardTimestamp, page_timeline.curCardHtml);
    })
  })

  
  _(["zoom", "scrub"]).each(function(q) {
    page_timeline.bind(q, function() {
      page_timeline.showCard(page_timeline.curCardTimestamp, page_timeline.curCardHtml);
    })
    
    $(".timeline_" + q).click(function() {
      var direction = $(this).attr("data-" + q + "-direction");
      page_timeline[q](direction, function() {
        page_timeline.trigger(q)
      });
    })
  })
  
  var throttledScrub = _.throttle(page_timeline.pixelScrub, 40)
  
  $(".timeline_notchbar_container").bind('mousewheel DOMMouseScroll', function(e) {
    e.preventDefault();
    if (e.wheelDelta) {
      throttledScrub(e.wheelDelta)
      page_timeline.trigger('mousewheel')
      return;
    }
    page_timeline.pixelScrub(-e.detail)
    page_timeline.trigger('DOMMouseScroll')
  });
  
  $(".timeline_notchbar_container").bind('dblclick', function(e) {
    e.preventDefault();
    page_timeline.zoom("in", function() {
      page_timeline.trigger('dblclick')
    });
  });
  
  $(window).resize(_.throttle(function() {
    var timelineWidth = $("#timeline").width();
    page_timeline.autoResize(timelineWidth);
  },200))
  
  /* make it global */
  
  window.globalTimeline = page_timeline
});

