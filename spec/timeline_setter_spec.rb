require File.expand_path(File.dirname(__FILE__) + '/spec_helper')

describe "TimelineSetter core" do
  it 'should build a hash from a spreadsheet' do
    TimelineSetter::Parser.new(TEST_CSV).events[0][:date].should eql("Feb. 18, 2003")
  end
  
  it 'should create json from an events hash' do
    events = TimelineSetter::Parser.new(TEST_CSV)
    j = TimelineSetter::Timeline.new({
     :events => events.events
    }).to_json
    JSON.parse(j)[0]['date'].should eql "Feb. 18, 2003"
  end
  
  it 'should create html from an events hash' do
    events = TimelineSetter::Parser.new(TEST_CSV)
    html = TimelineSetter::Timeline.new({
      :events => events.events
    }).timeline.to_s
    html.should =~ /"timestamp":1045544400/
  end
  
  it 'should create custom intervals' do
    events = TimelineSetter::Parser.new(TEST_CSV)
    html = TimelineSetter::Timeline.new({
      :events => events.events,
      :interval => "FullYear"
    }).timeline.to_s
    html.should =~ /"interval":"FullYear"/
  end
  
  it 'should create minified timelines' do
    events = TimelineSetter::Parser.new(TEST_CSV)
    html = TimelineSetter::Timeline.new({
      :events => events.events
    }).timeline_min.to_s
    
    # test to see we've compiled all the assets
    
    # test CSS
    html.should =~ /#timeline_setter/
    # test timeline
    html.should =~ /"timestamp":1045544400/
    # test underscore
    html.should =~ /Underscore\.js/
    # test jQuery
    html.should =~ /jQuery JavaScript Library/
    # test timeline-setter.js
    html.should =~ /INTERVAL_ORDER/
  end
end

describe "TimelineSetter CLI" do
  it 'should drop just timeline.html into tmp' do
    `mkdir /tmp/ts_test_1`
    %x[ #{TS_BINARY} -c #{TEST_CSV_PATH} -o /tmp/ts_test_1/ ]
    Dir.glob("/tmp/ts_test_1/*").should include("/tmp/ts_test_1/timeline.html")
    file = File.open("/tmp/ts_test_1/timeline.html").read
    file.should =~ /"timestamp":1045544400/ 
  end
  
  it 'should drop timeline.html and associated assets into tmp' do
    `mkdir /tmp/ts_test_2`
    %x[ #{TS_BINARY} -c #{TEST_CSV_PATH} -o /tmp/ts_test_2/ -a ]
    Dir.glob("/tmp/ts_test_2/*").should include("/tmp/ts_test_2/timeline.html")
    Dir.glob("/tmp/ts_test_2/javascripts/*").should include("/tmp/ts_test_2/javascripts/timeline-setter.js")
    Dir.glob("/tmp/ts_test_2/javascripts/vendor/*").should include("/tmp/ts_test_2/javascripts/vendor/jquery-min.js")
    Dir.glob("/tmp/ts_test_2/javascripts/vendor/*").should include("/tmp/ts_test_2/javascripts/vendor/underscore-min.js")
    Dir.glob("/tmp/ts_test_2/stylesheets/*").should include("/tmp/ts_test_2/stylesheets/timeline-setter.css")    
  end
  
  it 'should create a minified timeline in tmp' do
    `mkdir /tmp/ts_test_3`
    %x[ #{TS_BINARY} -c #{TEST_CSV_PATH} -o /tmp/ts_test_3/ -m ]
    file = File.open("/tmp/ts_test_3/timeline.html").read
    file.should =~ /"timestamp":1045544400/ 

    # test to see we've compiled all the assets
    
    # test CSS
    file.should =~ /#timeline_setter/
    # test timeline
    file.should =~ /"timestamp":1045544400/
    # test underscore
    file.should =~ /Underscore\.js/
    # test jQuery
    file.should =~ /jQuery JavaScript Library/
    # test timeline-setter.js
    file.should =~ /INTERVAL_ORDER/
  end
  
  after :all do
    `rm -rf /tmp/ts_test_1`
    `rm -rf /tmp/ts_test_2`
    `rm -rf /tmp/ts_test_3`
  end
  
  
end