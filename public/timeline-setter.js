function TimelineSetter(timelineData) {
  this.items = timelineData;
  this.times = _(this.items).map(function(q){
    return q.timestamp;
  });
  this.max = _(this.times).max();
  this.min = _(this.times).min();
};

TimelineSetter.prototype.createNotches = function() {
  console.log("max: "+ this.max);
  console.log("min: "+ this.min);
  var that = this;
  _(this.items).each(function(item) {
    var timestamp,position,tmpl,html;
    timestamp = item.timestamp;
    position = that.calculatePosition(timestamp);
    tmpl = _.template($("#notch_tmpl").html());
    html = tmpl(item);
    $(".timeline_notchbar").append(html);
    $(".notch_" + timestamp).css("right",position + "%");
  });
};

TimelineSetter.prototype.calculatePosition = function(timestamp) {
  return ((this.max - timestamp) / (this.max - this.min)) * 100;
};

TimelineSetter.prototype.template = function(timestamp) {
  var item,tmpl,html;
  item = _(this.items).select(function(q) {
    return q.timestamp === Number(timestamp);
  })[0];
  tmpl = _.template($("#card_tmpl").html());
  html = tmpl(item);
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
  var dir = direction === "in" ? "+" : "-";
  console.log(dir + "=" + this.curZoom + "%")
  $(".timeline_notchbar").animate({ width : dir + "=" + this.curZoom + "%"});
}

TimelineSetter.prototype.scrub = function(direction) {
  //don't allow scrubbage if we're not zoomed in
  if (!this.curZoom || this.curZoom === 100) return;
  
  
  this.curScrub = this.curScrub ? this.curScrub : 0;
  if (direction === "right") {
   if (this.curScrub === 80) return;
   this.curScrub += 20;
  }
  
  if (direction === "left") {
    if (this.curScrub === 0) return;
    this.curScrub -= 20;
  }
  var dir = direction === "left" ? "+" : "-";
  console.log(dir + "=" + this.curScrub + "%");
  $(".timeline_notchbar").animate(
    { left : dir + "=" + this.curScrub + "%" }
  );
} 

$(document).ready(function() {
  var page_timeline = new TimelineSetter(timelineData);
  page_timeline.createNotches();
  
  
  $(".timeline_notch").hover(function() {
    var timestamp,html,cardPosition;
    page_timeline.currentCard = timestamp;
    timestamp = $(this).attr("data-timestamp");
    html = page_timeline.template(timestamp);
    cardPosition = page_timeline.cardPosition(timestamp);
    $("#timeline_card_container").show().html(html).css("right",cardPosition + "%");
    $(".css_arrow").show().css("right",(page_timeline.calculatePosition(timestamp) - 2.8) + "%");
  },function() {
    var el = $("#timeline_card_container");
    // window.setTimeout(function(){
    //   $(".css_arrow").hide();
    //   el.hide();
    // },1000)
  });
  
  _(["zoom", "scrub"]).each(function(q) {
    $(".timeline_" + q).click(function() {
      var direction = $(this).attr("data-" + q + "-direction");
      page_timeline[q](direction);
    })
  })  
});

