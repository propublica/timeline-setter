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
    # test this somehow
  end
end