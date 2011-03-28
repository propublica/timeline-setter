require File.expand_path(File.dirname(__FILE__) + '/spec_helper')

describe "TimelineSetter" do
  it 'should build a hash from a spreadsheet' do
    TimelineSetter::Parser.new(TEST_CSV).events[0][:event_date].should eql("Feb. 18, 2003")
  end
  
  it 'should create json from an events hash' do
    events = TimelineSetter::Parser.new(TEST_CSV)
    j = TimelineSetter::Timeline.new(events.events).to_json
    JSON.parse(j)[0]['event_date'].should eql "Feb. 18, 2003"
  end
  
  it 'should create html from an events hash' do
    events = TimelineSetter::Parser.new(TEST_CSV)
    html = TimelineSetter::Timeline.new(events.events).timeline.to_s
    html.should =~ /<h2 class=\\\"timeline-img-hed\\\">Savelkoul Joins the Army<\/h2>/
  end
  
  it 'should create minified timelines' do
    events = TimelineSetter::Parser.new(TEST_CSV)
    html = TimelineSetter::Timeline.new(events.events).timeline_min.to_s
    
    # test to see we've compiled all the assets
    
    # test CSS
    html.should =~ /#timeline_setter/
    # test timeline
    html.should =~ /<h2 class=\\\"timeline-img-hed\\\">Savelkoul Joins the Army<\/h2>/
    # test underscore
    html.should =~ /Underscore\.js 1\.1\.4/
    # test jQuery
    html.should =~ /jQuery JavaScript Library v1\.4\.4/
    # test timeline-setter.js
    html.should =~ /INTERVAL_ORDER/
  end
end