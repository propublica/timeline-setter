function TimelineSetter(timelineData) {
  this.items = timelineData;
  this.times = _(this.items).map(function(q){
    return q.timestamp;
  });
  this.max = _(this.times).max();
  this.min = _(this.times).min();
  this.notchbar = $(".timeline_notchbar");
};

TimelineSetter.TOP_COLORS = ['#7C93AF', '#EBEBEB'];

TimelineSetter.prototype.createNotches = function() {
  var that = this;
  _(this.items).each(function(item) {
    var timestamp,position,tmpl,html;
    timestamp = item.timestamp;
    position = that.calculatePosition(timestamp);
    html = TimelineSetter.domTemplate("#notch_tmpl",item);

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
  latestYear = getYearFromTimestamp(this.max)

  for (i = earliestYear; i < latestYear + 1; i++) {
    var timestamp,year,html;
    timestamp = Date.parse(i) / 1000;
    year = i;
    html = TimelineSetter.domTemplate("#year_notch_tmpl", {'timestamp' : timestamp, 'year' : year })
    $(".timeline_notchbar").append(html);
    $(".year_notch_" + timestamp).css("right",this.calculatePosition(timestamp) + "%");
  }
}


TimelineSetter.prototype.calculatePosition = function(timestamp) {
  return ((this.max - timestamp) / (this.max - this.min)) * 100;
};

TimelineSetter.prototype.template = function(timestamp) {
  var item,tmpl,html;
  item = _(this.items).select(function(q) {
    return q.timestamp === Number(timestamp);
  })[0];
  html = TimelineSetter.domTemplate("#card_tmpl",item)
  return html;
};

TimelineSetter.prototype.showCard = function(timestamp, html) {
  var eventNotchOffset        = $(".notch_" + timestamp).offset();
  var timelineContainerWidth  = $("#timeline").width();
  var cardOffsetLeft = ((timelineContainerWidth - eventNotchOffset.left) < 250) ? eventNotchOffset.left - 250 : eventNotchOffset.left
  
  $("#timeline_card_container").show().html(html).offset({left : cardOffsetLeft - 15, top : eventNotchOffset.top + 41})
  $(".css_arrow").show().offset({left : eventNotchOffset.left, top : eventNotchOffset.top + 22})
}

TimelineSetter.prototype.next = function() {
  if (!this.currentCard) return;
};

TimelineSetter.prototype.prev = function() {
  if (!this.currentCard) return;

};

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
    });
  } else if (this.curZoom && (this.curZoom < (this.initialZoom * 2))) { 
    return;
  } else {
    this.curZoom /= 2;
    this.curOffset += this.curZoom/2
    el.animate({ 
      width : this.curZoom, 
      left  : this.curOffset
    });
  }
    
  if (cb){ cb() };
}

TimelineSetter.prototype.scrub = function(direction, cb) {
  //don't allow scrubbage if we're not zoomed in
  if (!this.curZoom || this.curZoom === this.initialZoom) return;
  
  //scrubbing "right" will move the notchbar "left" and vice versa
  //      << [=====] >>
  if (direction === "right") {
    this.curOffset += (this.curOffset * .30);
  }
  
  if (direction === "left") {
    this.curOffset -= (this.curOffset * .30);
  }

  $(".timeline_notchbar, #timeline_card_scroller_inner").animate({ 
    left : this.curOffset 
  });
  
  if (cb){ cb() };
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

$(document).ready(function() {
  var page_timeline = new TimelineSetter(timelineData);
  page_timeline.createNotches();
  page_timeline.createYearNotches();
  page_timeline.autoResize($("#timeline").width());
  
  $(".timeline_notch").hover(function() {
    var timestamp,html,cardPosition;
    page_timeline.currentCard = timestamp;
    timestamp = $(this).attr("data-timestamp");
    html = page_timeline.template(timestamp);
    
    page_timeline.showCard(timestamp, html);
    
  },function() {
    var el = $("#timeline_card_container");
    window.setTimeout(function(){
      $(".css_arrow").hide();
      el.hide();
    },2000)
  });
  
  _(["zoom", "scrub"]).each(function(q) {
    $(".timeline_" + q).click(function() {
      var direction = $(this).attr("data-" + q + "-direction");
      page_timeline[q](direction);
    })
  })
  
  $(".timeline_notchbar").draggable({axis : 'x'});
  
  $(window).resize(_.throttle(function() {
    var timelineWidth = $("#timeline").width();
    page_timeline.autoResize(timelineWidth);
  },200))
});

