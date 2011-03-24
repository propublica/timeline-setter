module TimelineSetter
  class Timeline
    attr_reader :timeline
    def initialize(events)
      @events = events
    end
  
    def to_html
      @events.inject([]) {|memo, evt| memo << Event.new(evt).to_html ; memo }
    end
  
    def to_json
      @events.collect {|r| r[:timestamp] = Time.parse(r[:event_date]).to_i }.sort{|a,b| b[:timestamp] <=> a[:timestamp]}
      @events.to_json
    end
      
    def timeline
      @html = self.to_html
      @timeline = ERB.new(File.open("#{TimelineSetter::ROOT}/templates/timeline.erb").read).result(binding)
    end
  end  
end