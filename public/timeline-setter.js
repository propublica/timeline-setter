function TimelineSetter() {
  this.items = [];
  
  var that = this;
  $(".item").each(function() {
    that.items.push(Number($(this).attr("data-item-timestamp")));
  });
  this.max = _(this.items).max();
  this.min = _(this.items).min();
}

TimelineSetter.prototype.positionItems = function() {
    var that = this;
    _(this.items).each(function(item) {
      var timestamp = item;
      var position = ((that.max / that.min) - (that.max / item)) * 1000;
      var el = $("#item_" + timestamp);
      el.css("left", position + "%");
      if (position > 70) {
        el.addClass("expand_left");
      }
    });
    return this;
}

$(document).ready(function() {
  var timeline = new TimelineSetter();
  timeline.positionItems();
});


/////////////////////////////////////

function DisabilityTimelineCard(el,e) {
  this.e = e;
  this.el = $(el);
  this.initialWidth = this.el.width();
  this.height = this.el.height();
  this.label = this.el.children(".item_label");
  this.doc_img = this.el.children(".doc_img");
};

DisabilityTimelineCard.prototype.activate = function() {
  this.e.type === "mouseenter" ? this.el.addClass("item_active") : this.el.removeClass("item_active")
  return this;
}

DisabilityTimelineCard.prototype.toFront = function() {
  var cards = $(".item");
  var card = this.el;
  var i = _.indexOf(cards,card);
  cards.splice(i,1);
  cards.push(card);
  _(cards).each(function(v,k){
      $(v).css("z-index",k*10);
  });
};

DisabilityTimelineCard.prototype.animation = function() {
  var obj = {};
  if (this.doesNotExpand()) return obj;
  
  var dir = this.e.type === 'mouseenter' ? '+' : '-';
  var oppdir = dir === "+" ? "-" : "+";
  obj['width'] = dir + "=130px";
  // obj['height'] = dir + "=15"
  if (this.el.hasClass("expand_left")) {
    obj['left'] = oppdir + "=13.5%";
  }
  return obj;
};

DisabilityTimelineCard.prototype.midLabelHover = function() {
  var targetLabel,toDo;
  var that = this;
  targetLabel = (function() {
    return that.el.hasClass("item_upper") ? "dept_ed_label" : "tina_brooks_label";
  })();
  toDo = (function() {
    return that.e.type === "mouseenter" ? "add" : "remove";
  })();
  $("." + targetLabel)[toDo + 'Class'](targetLabel + "_active");
  return this;
};

DisabilityTimelineCard.prototype.showHideDoc = function() {
  this.e.type === "mouseenter" ? this.doc_img.show() : this.doc_img.hide();
  return this;
}

DisabilityTimelineCard.prototype.isActive = function() {
  return this.el.hasClass("item_active") ? true : false
}

DisabilityTimelineCard.prototype.doesNotExpand = function() {
  return this.el.hasClass("item_no_expand") ? true : false
}
  
DisabilityTimelineCard.prototype.isArrowHover = function() {
  return this.e.target.className.match(/css_arrow/) ? true : false;
}
  
/* -- */
  
$(function() {    
  $(".item").hover(function(e) {
    var item = new DisabilityTimelineCard(this,e);
    item.toFront();
    $(item.label).css("width", item.initialWidth);
    $(this).addClass("item_active")
       .animate(item.animation(), 150,function() {
         item.showHideDoc().midLabelHover();
       })
  },function(e) {
    var item = new DisabilityTimelineCard(this,e);
    item.showHideDoc();      
    $(this).animate(item.animation(), 150, function() {
       item.showHideDoc().activate().midLabelHover();
    })      
  });
});
