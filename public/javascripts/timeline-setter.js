function TimelineSetter(timelineData) {
  this.items = timelineData;
  this.times = _(this.items).map(function(q){
    return q.timestamp;
  });
  this.max = _(this.times).max();
  this.min = _(this.times).min();
};

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
  years = [];
  earliestYear = new Date(); earliestYear.setTime(this.min * 1000);
  latestYear = new Date(); latestYear.setTime(this.max * 1000);
  earliestYear = earliestYear.getFullYear();
  latestYear = latestYear.getFullYear();
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

TimelineSetter.prototype.cardPosition = function(timestamp) {
  var barWidth,cardWidth,notchPosition,cardPosition;
  barWidth = $(".timeline_notchbar").width();
  cardWidth = 300;
  notchPosition = this.calculatePosition(timestamp);
  return cardPosition = notchPosition > 50 ? notchPosition : (notchPosition + ((cardWidth / barWidth) * 100));
};

TimelineSetter.prototype.next = function() {
  if (!this.currentCard) return;
};

TimelineSetter.prototype.prev = function() {
  if (!this.currentCard) return;

};

TimelineSetter.prototype.zoom = function(direction) {
  this.curZoom = this.curZoom ? this.curZoom : 100;
  if (direction === "in") {
    this.curZoom += 100;
  } else if (this.curZoom === 100) {
    return;
  } else {
    this.curZoom -= 100;
  }
  console.log(this.curZoom + "%")
  $(".timeline_notchbar, #timeline_card_scroller_inner").animate({ width : this.curZoom + "%"});
}

TimelineSetter.prototype.scrub = function(direction) {
  console.log(this.curScrub)
  //don't allow scrubbage if we're not zoomed in
  if (!this.curZoom || this.curZoom === 100) return;
  this.curScrub = this.curScrub ? this.curScrub : 0;

  //scrubbing "right" will move the notchbar "left" and vice versa
  //      << [=====] >>
  if (direction === "right") {
   if (this.curScrub <= -(this.curZoom ? (this.curZoom * .80) : 100)) return;
   console.log('right')
   this.curScrub -= this.curZoom ? (20 * (this.curZoom / 100)) : 20;
  }
  
  if (direction === "left") {
    if (this.curScrub >= 20) return;
    console.log('left')
    this.curScrub += this.curZoom ? (20 * (this.curZoom / 100)) : 20;
  }

  console.log(this.curScrub + "%");
  $(".timeline_notchbar, #timeline_card_scroller_inner").animate(
    { left : this.curScrub + "%" }
  );
} 

TimelineSetter.prototype.autoResize = function(width) {
  var optimalWidth = 960;
  var zoomIntervals = Math.floor(Math.floor(width / optimalWidth * 100) / 20)
  console.log(zoomIntervals)
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
    cardPosition = page_timeline.cardPosition(timestamp);
    $("#timeline_card_container").show().html(html).css("right",cardPosition + "%");
    $(".css_arrow").show().css("right",(page_timeline.calculatePosition(timestamp) - 2) + "%");
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
  
  $(window).resize(_.throttle(function() {
    var timelineWidth = $("#timeline").width();
    page_timeline.autoResize(timelineWidth);
  },200))
});

