function TimelineSetter(timelineData) {
  this.items = timelineData;
  this.times = _(this.items).map(function(q){
    return q.timestamp;
  })
  this.max = _(this.times).max();
  this.min = _(this.times).min();
}

TimelineSetter.prototype.createNotches = function() {
  console.log("max: "+ this.max);
  console.log("min: "+ this.min);
  var that = this;
  _(this.items).each(function(item) {
    var timestamp,position,tmpl,html;
    timestamp = item.timestamp;
    position = that.calculatePosition(timestamp);
    tmpl = _.template($("#notch_tmpl").html());
    html = tmpl(item)
    $(".timeline_notchbar").append(html);
    $(".notch_" + timestamp).css("right",position + "%");
  });
}

TimelineSetter.prototype.calculatePosition = function(timestamp) {
  return ((this.max - timestamp) / (this.max - this.min)) * 100;
}

TimelineSetter.prototype.template = function(timestamp) {
  var item,tmpl,html;
  item = _(this.items).select(function(q) {
    return q.timestamp === Number(timestamp);
  })[0];
  tmpl = _.template($("#card_tmpl").html());
  html = tmpl(item);
  return html;
}

TimelineSetter.prototype.cardPosition = function(timestamp) {
  var barWidth,cardWidth,notchPosition,cardPosition;
  barWidth = $(".timeline_notchbar").width();
  cardWidth = 250;
  notchPosition = this.calculatePosition(timestamp);
  return cardPosition = notchPosition > 50 ? notchPosition : (notchPosition + ((cardWidth / barWidth) * 100))
}

$(document).ready(function() {
  var page_timeline = new TimelineSetter(timelineData);
  page_timeline.createNotches();
  
  
  $(".timeline_notch").hover(function() {
    var timestamp,html,position;
    timestamp = $(this).attr("data-timestamp");
    html = page_timeline.template(timestamp);
    cardPosition = page_timeline.cardPosition(timestamp);
    console.log(cardPosition);
    $("#timeline_card_container").show().html(html).css("right",cardPosition + "%");
    $(".css_arrow").show().css("right",(page_timeline.calculatePosition(timestamp) - 2.8) + "%");
  },function() {
    var el = $("#timeline_card_container");
    // window.setTimeout(function(){
    //   el.hide();
    // },1000)
  });
});